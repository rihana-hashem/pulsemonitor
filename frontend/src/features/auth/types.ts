/** Role names; they match PulseMonitor.Domain.Users.Roles. */
export type Role = 'Admin' | 'User'

/** Mirrors AuthUserDto in PulseMonitor.Application.Auth. */
export type AuthUser = {
  userId: number
  userName: string
  email: string
  roles: Role[]
}

/** Mirrors AuthResponse in the API. The refresh token is never in here: it is an httpOnly cookie. */
export type AuthResponse = {
  accessToken: string
  accessTokenExpiresAt: string
  user: AuthUser
}

export type LoginInput = {
  userNameOrEmail: string
  password: string
}

export type RegisterInput = {
  userName: string
  email: string
  password: string
}
