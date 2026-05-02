import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Profile } from '../entities/profile.entity'

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private profileRepo: Repository<Profile>,
  ) {}

  /* =========================
     GET PROFILES BY USER
  ========================= */
  async findByUser(userId: number) {
    const id = Number(userId)
    if (!id) return []

    return this.profileRepo.find({
      where: { user: { id } },
      relations: { user: true },
    })
  }

  /* =========================
     GET SINGLE PROFILE
  ========================= */
  async findOne(id: number) {
    return this.profileRepo.findOne({
      where: { id },
    })
  }

  /* =========================
     CREATE PROFILE
  ========================= */
  async create(data: any) {
  const profile = this.profileRepo.create({
    name: data.name,
    pin: data.pin,
    avatar: data.avatar || null,
    user: { id: data.userId } // 🔥 IMPORTANT FIX
  })

  return this.profileRepo.save(profile)
}

  /* =========================
     UPDATE PIN
  ========================= */
  async updatePin(id: number, pin: string) {
    return this.profileRepo.update(id, { pin })
  }

  /* =========================
     DELETE PROFILE
  ========================= */
  async delete(id: number) {
    return this.profileRepo.delete(id)
  }
}