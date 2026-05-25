import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Profile } from './entities/profile.entity';

export async function seedAdmin(dataSource: DataSource) {
  const userRepo = dataSource.getRepository(User);
  const profileRepo = dataSource.getRepository(Profile);


  let admin = await userRepo.findOne({
    where: { username: 'admin' },
  });

  if (!admin) {
    const hashed = await bcrypt.hash('admin@123', 10);

    admin = userRepo.create({
      username: 'admin',
      password: hashed,
    });

    await userRepo.save(admin);

    console.log('✅ Admin user created');
  } else {
    console.log('ℹ️ Admin already exists');
  }


  const existingProfiles = await profileRepo.find({
    where: { user: { id: admin.id } },
  });

  if (existingProfiles.length === 0) {
    await profileRepo.save([
      {
        name: 'Admin',
        pin: '1111',
        user: admin,
      },
      {
        name: 'Technical',
        pin: '2222',
        user: admin,
      },
      {
        name: 'Application',
        pin: '3333',
        user: admin,
      },
      {
        name: 'Networks',
        pin: '4444',
        user: admin,
      },
      {
        name: 'Programmers',
        pin: '5555',
        user: admin,
      },
      {
        name: 'Preventive',
        pin: '6666',
        user: admin,
      },
    ]);

    console.log('🎬 Profiles created');
  } else {
    console.log('ℹ️ Profiles already exist');
  }
}