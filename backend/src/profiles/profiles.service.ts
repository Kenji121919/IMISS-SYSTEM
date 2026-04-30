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

  async findByUser(userId: number) {
    const id = Number(userId)

    if (!id) return []

    return this.profileRepo.find({
      where: {
        user: { id },
      },
      relations: {
        user: true,
      },
    })
  }

  async findOne(id: number) {
  return this.profileRepo.findOne({
    where: { id },
  })
}
}