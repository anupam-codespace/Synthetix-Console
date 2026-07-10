import prisma from './prisma';

export async function runSimulation(jobId: string) {
  // Run asynchronously in the background
  setTimeout(async () => {
    try {
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: { worker: true }
      });

      if (!job) return;

      const phases = [
        { status: 'preparing', progress: 10.0, msg: 'Preparing workspace sandbox and resolving dependencies...', delay: 1000 },
        { status: 'worker_assigned', progress: 20.0, msg: 'Active worker assigned and runtime directory mounted.', delay: 1200 },
        { status: 'running', progress: 35.0, msg: 'Initializing runtime runtime environment...', delay: 1500 },
        { status: 'processing', progress: 60.0, msg: 'Executing code loop and processing records...', delay: 2000 },
        { status: 'aggregating', progress: 80.0, msg: 'Aggregating worker outputs and intermediate calculations...', delay: 1200 },
        { status: 'saving', progress: 95.0, msg: 'Writing output files and syncing metadata database...', delay: 1000 },
      ];

      // Assign a worker if not already assigned
      let workerId = job.workerId;
      if (!workerId) {
        const workers = await prisma.worker.findMany({ where: { status: { not: 'offline' } } });
        if (workers.length > 0) {
          const worker = workers[Math.floor(Math.random() * workers.length)];
          workerId = worker.id;
          await prisma.job.update({
            where: { id: jobId },
            data: { workerId }
          });
          await prisma.worker.update({
            where: { id: workerId },
            data: { status: 'busy', jobsActive: { increment: 1 } }
          });
        }
      }

      const activeWorker = workerId ? await prisma.worker.findUnique({ where: { id: workerId } }) : null;
      const workerName = activeWorker?.name || 'System Worker';

      await writeLog(jobId, 'info', `Job initialized. Routing to execution worker node: ${workerName}`);
      await writeHistory(jobId, 'queued', `Job placed in queue.`);

      // 25% failure chance, or deterministic failure if specific type is set (like report generation for seed)
      const shouldFail = Math.random() < 0.25;
      const failAtPhase = shouldFail ? Math.floor(Math.random() * (phases.length - 1)) + 1 : -1;

      for (let i = 0; i < phases.length; i++) {
        const phase = phases[i];
        await sleep(phase.delay);

        // Check if job was cancelled
        const currentJob = await prisma.job.findUnique({ where: { id: jobId } });
        if (!currentJob || currentJob.status === 'cancelled') {
          if (workerId) {
            await prisma.worker.update({
              where: { id: workerId },
              data: { status: 'idle', jobsActive: { decrement: 1 } }
            });
          }
          await writeLog(jobId, 'warn', 'Job execution cancelled by operator.');
          return;
        }

        // Handle simulated failure
        if (shouldFail && i === failAtPhase) {
          const failureData = getFailureDetails(job.type);
          await prisma.job.update({
            where: { id: jobId },
            data: {
              status: 'failed',
              progress: phase.progress,
              completedAt: new Date(),
              failureReason: failureData.reason,
              failureFix: failureData.fix,
              failureCauses: JSON.stringify(failureData.causes)
            }
          });

          await writeLog(jobId, 'error', `RuntimeError in phase '${phase.status}': ${failureData.reason}`);
          await writeLog(jobId, 'error', 'Job process exited with code 1.');
          await writeHistory(jobId, 'failed', `Job execution failed at phase '${phase.status}'.`);

          if (workerId) {
            await prisma.worker.update({
              where: { id: workerId },
              data: { status: 'idle', jobsActive: { decrement: 1 } }
            });
          }

          await createJobNotification(job.ownerId, jobId, job.type, 'failed');
          return;
        }

        // Update DB to the next phase
        await prisma.job.update({
          where: { id: jobId },
          data: {
            status: phase.status,
            progress: phase.progress
          }
        });

        await writeLog(jobId, 'info', `${phase.msg} (Progress: ${phase.progress}%)`);
        await writeHistory(jobId, phase.status, `State transitioned to ${phase.status}.`);

        if (phase.status === 'processing') {
          await generateJobTypeSpecificLogs(jobId, job.type);
        }
      }

      // Success completion
      await sleep(1000);
      const outputData = generateOutputData(job.type);
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          progress: 100.0,
          completedAt: new Date(),
          output: JSON.stringify(outputData)
        }
      });

      await writeLog(jobId, 'info', 'Job execution completed successfully. Output artifacts committed.');
      await writeHistory(jobId, 'completed', 'Job completed successfully.');

      if (workerId) {
        await prisma.worker.update({
          where: { id: workerId },
          data: {
            status: 'idle',
            jobsActive: { decrement: 1 },
            jobsCompleted: { increment: 1 }
          }
        });
      }

      await createJobNotification(job.ownerId, jobId, job.type, 'completed');

    } catch (err) {
      console.error('Job simulation error:', err);
    }
  }, 10);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function writeLog(jobId: string, level: string, message: string) {
  try {
    await prisma.log.create({
      data: { jobId, level, message }
    });
  } catch (e) {
    console.error('Failed to write log:', e);
  }
}

async function writeHistory(jobId: string, status: string, message: string) {
  try {
    await prisma.jobHistory.create({
      data: { jobId, status, message }
    });
  } catch (e) {
    console.error('Failed to write history:', e);
  }
}

async function createJobNotification(userId: string, jobId: string, jobType: string, status: string) {
  try {
    const title = status === 'completed' ? 'Job Completed Successfully' : 'Job Execution Failed';
    const message = status === 'completed'
      ? `Job ${jobType} (${jobId.substring(0, 8)}) completed in 10s.`
      : `Job ${jobType} (${jobId.substring(0, 8)}) failed with error.`;

    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type: 'job_status',
        status: 'unread',
        jobId,
        groupKey: `job_${status}_group`
      }
    });
  } catch (e) {
    console.error('Failed to create notification:', e);
  }
}

function getFailureDetails(type: string) {
  switch (type) {
    case 'model_training':
      return {
        reason: 'CUDA out of memory. Tried to allocate 16.00 GiB (GPU 0; 15.78 GiB total capacity; 12.32 GiB already allocated).',
        fix: 'Reduce your batch size from 64 to 32 or 16. Alternatively, select a GPU node with more VRAM (e.g., A100 instead of T4) or enable mixed-precision training (FP16).',
        causes: [
          'Batch size too large for target GPU memory',
          'Model size (parameters) exceeds memory bounds',
          'Memory leak in training loop (unreleased gradients)'
        ]
      };
    case 'data_ingestion':
      return {
        reason: 'ETL Connection Timeout. Database connection to remote RDS host timed out after 30000ms.',
        fix: 'Verify database network routing/security group configurations. Check if the database CPU is pinned or database is locked. Increase socket timeout or implement connection pooling.',
        causes: [
          'Host database server is offline or experiencing heavy load',
          'VPC / Security group firewall blocked incoming traffic',
          'Incorrect database username or credentials expired'
        ]
      };
    case 'sentiment_analysis':
      return {
        reason: 'ModelInferenceError: Pipeline model failed to load in HuggingFace cache directory (Read Timeout).',
        fix: 'Pre-download weights during build step or increase the download timeout environment variable. Check disk space in the cache folder.',
        causes: [
          'HuggingFace registry rate limit or network downtime',
          'Local disk full on worker cache path (/root/.cache)',
          'Network connection interrupted during weight streaming'
        ]
      };
    case 'image_processing':
      return {
        reason: 'InvalidImageException: Cannot decode target file header. File signature is corrupt or format is unsupported.',
        fix: 'Sanitize file uploads. Add validation step before job submission to block corrupt or unrecognized image formats (JPEG, PNG, WEBP are supported).',
        causes: [
          'Corrupted byte stream during file upload',
          'Unsupported file extension or custom encoding',
          'Missing magic bytes in file header'
        ]
      };
    default:
      return {
        reason: 'ProcessExitCodeError: Child process exited with non-zero code 137 (OOM Killer).',
        fix: 'Increase worker RAM allocation or optimize code memory usage. Check if garbage collection can be configured to run more frequently.',
        causes: [
          'Memory consumption exceeded cgroup limit on worker container',
          'Memory leak in worker execution pipeline',
          'Attempted load of dataset too large for host memory'
        ]
      };
  }
}

function generateOutputData(type: string) {
  switch (type) {
    case 'sentiment_analysis':
      return {
        processedCount: 1542,
        positive: 942,
        neutral: 410,
        negative: 190,
        averageConfidence: 0.89,
        executionHost: 'Alpha-Worker',
      };
    case 'model_training':
      return {
        epochsCompleted: 10,
        finalLoss: 0.0842,
        valAccuracy: 0.9612,
        checkpointUri: 's3://synthetix-weights/resnet50-epoch10.ckpt',
        trainTimeSeconds: 58.2,
      };
    case 'data_ingestion':
      return {
        recordsParsed: 45291,
        insertedCount: 45280,
        skippedCount: 11,
        timeElapsedMs: 8402,
        targetCollection: 'analytics_events',
      };
    case 'image_processing':
      return {
        imagesProcessed: 142,
        averageRescaleRatio: 0.5,
        savedVramBytes: 48210340,
        storageSavedMb: 12.8,
      };
    default:
      return {
        status: 'success',
        processedItems: 100,
        completedAt: new Date().toISOString(),
      };
  }
}

async function generateJobTypeSpecificLogs(jobId: string, type: string) {
  switch (type) {
    case 'model_training':
      await writeLog(jobId, 'debug', 'Initializing AdamW Optimizer with lr=0.001, weight_decay=0.01');
      await sleep(350);
      await writeLog(jobId, 'info', 'Epoch 1/5 - Loss: 1.2842 - Accuracy: 62.4%');
      await sleep(350);
      await writeLog(jobId, 'info', 'Epoch 2/5 - Loss: 0.6421 - Accuracy: 81.9%');
      await sleep(350);
      await writeLog(jobId, 'info', 'Epoch 3/5 - Loss: 0.3129 - Accuracy: 90.1%');
      await sleep(350);
      await writeLog(jobId, 'info', 'Epoch 4/5 - Loss: 0.1542 - Accuracy: 94.8%');
      await sleep(350);
      await writeLog(jobId, 'info', 'Epoch 5/5 - Loss: 0.0842 - Accuracy: 96.1%');
      break;
    case 'data_ingestion':
      await writeLog(jobId, 'debug', 'Establishing secure socket connection to PostgreSQL database...');
      await sleep(350);
      await writeLog(jobId, 'info', 'Connection succeeded. Executing batch stream query...');
      await sleep(350);
      await writeLog(jobId, 'info', 'Streaming records... 10k parsed.');
      await sleep(350);
      await writeLog(jobId, 'info', 'Streaming records... 30k parsed.');
      await sleep(350);
      await writeLog(jobId, 'warn', 'Detected 11 records with invalid datetime format. Skipping rows.');
      await sleep(350);
      await writeLog(jobId, 'info', 'Stream closed. Commit complete.');
      break;
    case 'image_processing':
      await writeLog(jobId, 'debug', 'Setting target resolution bounds to 1080p, quality=85');
      await sleep(350);
      await writeLog(jobId, 'info', 'Scanning uploads directory: 142 items detected.');
      await sleep(350);
      await writeLog(jobId, 'info', 'Batch processing images: [1-50] scaled and compressed.');
      await sleep(350);
      await writeLog(jobId, 'info', 'Batch processing images: [51-100] scaled and compressed.');
      await sleep(350);
      await writeLog(jobId, 'info', 'Batch processing images: [101-142] scaled and compressed.');
      break;
    default:
      await writeLog(jobId, 'info', 'Running core pipeline components...');
      await sleep(350);
      await writeLog(jobId, 'debug', 'Step 1 completed.');
      await sleep(350);
      await writeLog(jobId, 'debug', 'Step 2 completed.');
      await sleep(350);
      await writeLog(jobId, 'debug', 'Step 3 completed.');
      break;
  }
}
