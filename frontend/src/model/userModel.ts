export interface UserModel {
    id: string | null
    name: string | null
    email: string | null
    subscription: 'free' | 'pro' | null
}