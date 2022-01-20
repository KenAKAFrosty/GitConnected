import { Request } from 'express'

export interface IDatabaseUser {
    _id: string
    __v: number
    discord: {
        id: string
        token: string
        username: string
        avatar?: string
        discriminator: string
        banner?: string
        banner_color?: string
    }
    github: {
        id: string
        token: string
        json?: any
    }
    twitter: {
        id: string
        token: string
        tokenSecret: string
        username: string
    }
}

export interface IUser {
    discord: {
        id: string
        username: string
        avatar?: string
        discriminator: string
        banner?: string
        banner_color?: string
    }
    github?: {
        id: string
        connected: boolean
        json?: {
            login?: string
            avatar_url?: string
            html_url?: string
            followers_url?: string
            following_url?: string
            name?: string
            company? : string
            hireable?: string
            blog?: string
            location?: string
            bio?: string
            twitter_username?: string
            followers?: number
            following?: number
        }
    }
    twitter?: {
        id: string
        connected: boolean
        username: string
    }
}

export interface IReqAuth extends Request {
    user?: IDatabaseUser
}