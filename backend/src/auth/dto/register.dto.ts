import { IsString, MinLength, IsEmail, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  @MinLength(3)
  username!: string;

  @IsEmail()
  email!: string;

  @IsString()
  mobile!: string;

  @IsString()
  @MinLength(2)
  organizationName!: string;        
  
  @IsString()
  @MinLength(6)
  password!: string;
}