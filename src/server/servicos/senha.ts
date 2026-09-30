import bcrypt from 'bcryptjs'
import { custoBcrypt } from '../config'

export function gerarHash(senha: string): Promise<string> {
  return bcrypt.hash(senha, custoBcrypt)
}

export function conferirHash(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash)
}
