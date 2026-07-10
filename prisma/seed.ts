import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Default User
  const passwordHash = bcrypt.hashSync('adminpass', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@synthetix.dev' },
    update: {},
    create: {
      email: 'admin@synthetix.dev',
      name: 'Synthetix Admin',
      passwordHash,
      preferences: {
        create: {
          theme: 'dark',
          emailNotifications: true,
          savedFilters: JSON.stringify([
            { id: '1', name: 'High Priority Running', filters: { priority: 'high', status: 'running' } }
          ])
        }
      }
    }
  });

  console.log('User seeded:', user.email);

  // 2. Create Workers
  const worker1 = await prisma.worker.upsert({
    where: { name: 'Alpha-Worker' },
    update: {},
    create: {
      name: 'Alpha-Worker',
      status: 'idle',
      cpu: 14.5,
      memory: 28.2,
      jobsActive: 0,
      jobsCompleted: 142,
      lastSeen: new Date(),
    }
  });

  const worker2 = await prisma.worker.upsert({
    where: { name: 'Beta-Worker' },
    update: {},
    create: {
      name: 'Beta-Worker',
      status: 'idle',
      cpu: 8.2,
      memory: 19.4,
      jobsActive: 0,
      jobsCompleted: 98,
      lastSeen: new Date(),
    }
  });

  const worker3 = await prisma.worker.upsert({
    where: { name: 'Gamma-Worker' },
    update: {},
    create: {
      name: 'Gamma-Worker',
      status: 'offline',
      cpu: 0.0,
      memory: 0.0,
      jobsActive: 0,
      jobsCompleted: 45,
      lastSeen: new Date(Date.now() - 3600000 * 4), // 4 hours ago
    }
  });

  const worker4 = await prisma.worker.upsert({
    where: { name: 'Delta-Worker' },
    update: {},
    create: {
      name: 'Delta-Worker',
      status: 'busy',
      cpu: 82.1,
      memory: 76.8,
      jobsActive: 1,
      jobsCompleted: 211,
      lastSeen: new Date(),
    }
  });

  console.log('Workers seeded.');

  // 3. Clear existing jobs to ensure clean seed
  await prisma.job.deleteMany();
  await prisma.notification.deleteMany();

  // 4. Create Completed Job (Sentiment Analysis)
  const jobCompleted = await prisma.job.create({
    data: {
      ownerId: user.id,
      workerId: worker1.id,
      priority: 'low',
      status: 'completed',
      progress: 100,
      type: 'sentiment_analysis',
      createdAt: new Date(Date.now() - 3600000), // 1 hour ago
      startedAt: new Date(Date.now() - 3600000 + 5000),
      completedAt: new Date(Date.now() - 3600000 + 25000),
      estimatedDuration: 20,
      output: JSON.stringify({
        processedCount: 1542,
        positive: 942,
        neutral: 410,
        negative: 190,
        averageConfidence: 0.89,
      }),
      logs: {
        create: [
          { level: 'info', message: 'Job initialized. Ingesting customer reviews...', timestamp: new Date(Date.now() - 3600000 + 1000) },
          { level: 'info', message: 'Loaded 1,542 review entries from vector cache.', timestamp: new Date(Date.now() - 3600000 + 5000) },
          { level: 'debug', message: 'Evaluating sentiment using MiniLM-L6 model...', timestamp: new Date(Date.now() - 3600000 + 10000) },
          { level: 'info', message: 'Inference complete. Summarizing findings...', timestamp: new Date(Date.now() - 3600000 + 18000) },
          { level: 'info', message: 'Success! Results written to main reporting database.', timestamp: new Date(Date.now() - 3600000 + 24000) },
        ]
      },
      history: {
        create: [
          { status: 'queued', message: 'Job placed in lower priority queue.' },
          { status: 'preparing', message: 'Preparing sandbox resources.' },
          { status: 'worker_assigned', message: 'Worker Alpha-Worker assigned.' },
          { status: 'running', message: 'Model loading completed. Running inference.' },
          { status: 'completed', message: 'Job completed successfully.' },
        ]
      }
    }
  });

  // 5. Create Failed Job (Model Training - Out of Memory)
  const jobFailed = await prisma.job.create({
    data: {
      ownerId: user.id,
      workerId: worker4.id,
      priority: 'high',
      status: 'failed',
      progress: 45.0,
      type: 'model_training',
      createdAt: new Date(Date.now() - 1800000), // 30 mins ago
      startedAt: new Date(Date.now() - 1800000 + 2000),
      completedAt: new Date(Date.now() - 1800000 + 15000),
      estimatedDuration: 60,
      failureReason: 'CUDA out of memory. Tried to allocate 16.00 GiB (GPU 0; 15.78 GiB total capacity; 12.32 GiB already allocated).',
      failureFix: 'Reduce your batch size from 64 to 32 or 16. Alternatively, select a GPU node with more VRAM (e.g., A100 instead of T4) or enable mixed-precision training (FP16).',
      failureCauses: JSON.stringify([
        'Batch size too large for target GPU memory',
        'Model size (parameters) exceeds memory bounds',
        'Memory leak in training loop (unreleased gradients)'
      ]),
      logs: {
        create: [
          { level: 'info', message: 'Starting job model_training...', timestamp: new Date(Date.now() - 1800000 + 1000) },
          { level: 'info', message: 'Downloading ResNet50 base weights...', timestamp: new Date(Date.now() - 1800000 + 3000) },
          { level: 'info', message: 'Base weights successfully downloaded (98.2 MB). Starting training loop...', timestamp: new Date(Date.now() - 1800000 + 5000) },
          { level: 'info', message: 'Epoch 1/10 - Batch 0/1000 - Loss: 2.8941', timestamp: new Date(Date.now() - 1800000 + 8000) },
          { level: 'info', message: 'Epoch 1/10 - Batch 200/1000 - Loss: 1.7642', timestamp: new Date(Date.now() - 1800000 + 12000) },
          { level: 'error', message: 'RuntimeError: CUDA out of memory. Tried to allocate 16.00 GiB.', timestamp: new Date(Date.now() - 1800000 + 14000) },
          { level: 'error', message: 'Execution halted. Cleaning up GPU contexts...', timestamp: new Date(Date.now() - 1800000 + 15000) },
        ]
      },
      history: {
        create: [
          { status: 'queued', message: 'Job scheduled.' },
          { status: 'preparing', message: 'Provisioning node Delta-Worker.' },
          { status: 'worker_assigned', message: 'Worker Delta-Worker assigned.' },
          { status: 'running', message: 'Execution started.' },
          { status: 'failed', message: 'Job failed due to CUDA out of memory.' },
        ]
      }
    }
  });

  // 6. Create notifications
  await prisma.notification.create({
    data: {
      userId: user.id,
      title: 'Job Completed Successfully',
      message: `Job sentiment_analysis (${jobCompleted.id.substring(0, 8)}) completed in 20s.`,
      type: 'job_status',
      status: 'read',
      jobId: jobCompleted.id,
      createdAt: new Date(Date.now() - 3600000),
      groupKey: 'job_completed_group'
    }
  });

  await prisma.notification.create({
    data: {
      userId: user.id,
      title: 'Job Execution Failed',
      message: `Job model_training (${jobFailed.id.substring(0, 8)}) failed with CUDA out of memory.`,
      type: 'job_status',
      status: 'unread',
      jobId: jobFailed.id,
      createdAt: new Date(Date.now() - 1800000),
      groupKey: 'job_failed_group'
    }
  });

  console.log('Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
