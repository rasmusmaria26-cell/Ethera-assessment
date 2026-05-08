import 'dotenv/config';
import pool from './src/db/pool.js';
import bcrypt from 'bcryptjs';

async function seed() {
  try {
    console.log('Seeding mock data...');

    // 1. Create or get main user
    const mainEmail = 'rasmusmaria26@gmail.com';
    let mainUserRes = await pool.query('SELECT id FROM users WHERE email = $1', [mainEmail]);
    
    if (mainUserRes.rows.length === 0) {
      const hash = await bcrypt.hash('Rasmusmaria@26', 10);
      mainUserRes = await pool.query(
        'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
        ['Rasmus Maria', mainEmail, hash]
      );
    }
    const mainUserId = mainUserRes.rows[0].id;

    // 2. Create mock team members
    const members = [
      { name: 'Alice Smith', email: 'alice@example.com' },
      { name: 'Bob Johnson', email: 'bob@example.com' },
      { name: 'Charlie Lee', email: 'charlie@example.com' },
    ];

    const memberIds = [];
    for (const m of members) {
      let res = await pool.query('SELECT id FROM users WHERE email = $1', [m.email]);
      if (res.rows.length === 0) {
        const hash = await bcrypt.hash('password123', 10);
        res = await pool.query(
          'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
          [m.name, m.email, hash]
        );
      }
      memberIds.push(res.rows[0].id);
    }

    // 3. Create mock projects
    const projectsData = [
      {
        name: 'Website Redesign',
        description: 'Overhaul the corporate website with a new design system and improved SEO.',
      },
      {
        name: 'Q3 Marketing Campaign',
        description: 'Plan and execute the marketing strategy for the upcoming product launch.',
      },
      {
        name: 'Mobile App Beta',
        description: 'Track issues and feedback for the iOS and Android beta release.',
      }
    ];

    for (const p of projectsData) {
      // Create project
      const projRes = await pool.query(
        'INSERT INTO projects (name, description, created_by) VALUES ($1, $2, $3) RETURNING id',
        [p.name, p.description, mainUserId]
      );
      const projectId = projRes.rows[0].id;

      // Add main user as admin
      await pool.query(
        'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
        [projectId, mainUserId, 'admin']
      );

      // Add other users as members
      for (const mId of memberIds) {
        await pool.query(
          'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
          [projectId, mId, 'member']
        );
      }

      // Generate 5-10 random tasks per project
      const numTasks = Math.floor(Math.random() * 6) + 5; // 5 to 10
      const statuses = ['todo', 'todo', 'inprogress', 'inprogress', 'done'];
      const priorities = ['low', 'medium', 'medium', 'high'];
      
      const sampleTasks = [
        'Design homepage mockup', 'Setup CI/CD pipeline', 'Write documentation', 
        'Fix navigation bug', 'Client presentation', 'Update dependency packages',
        'Database migration', 'Create email templates', 'Review PRs', 'Optimize images'
      ];

      for (let i = 0; i < numTasks; i++) {
        const title = sampleTasks[Math.floor(Math.random() * sampleTasks.length)] + ` (Task ${i+1})`;
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const priority = priorities[Math.floor(Math.random() * priorities.length)];
        const assignedTo = Math.random() > 0.3 ? memberIds[Math.floor(Math.random() * memberIds.length)] : mainUserId;
        
        // Random due date between -5 days and +15 days from now
        const daysOffset = Math.floor(Math.random() * 20) - 5;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + daysOffset);

        await pool.query(
          `INSERT INTO tasks (project_id, title, description, due_date, priority, status, assigned_to, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            projectId, 
            title, 
            'Detailed description for ' + title, 
            dueDate.toISOString().split('T')[0], 
            priority, 
            status, 
            assignedTo, 
            mainUserId
          ]
        );
      }
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
