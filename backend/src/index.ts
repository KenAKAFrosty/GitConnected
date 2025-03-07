import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import session from 'express-session'
import passport from 'passport'
import User from './User'
import routes from './routes/index'
import { IDatabaseUser, IReqAuth, IUser } from './interface'
import mongoStore from 'connect-mongo'
import Twitter from 'twit'

import { discordStrategy } from './strategies/discord';
import { gitHubStrategy } from './strategies/github';
import { twitterStrategy } from './strategies/twitter';

const app = express()

mongoose.connect(`${process.env.START_MONGODB}${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}${process.env.END_MONGODB}`, (err) => {
    if (err) throw err
    console.log('connected to MongoDB succesfully')
})

app.use(express.json())
app.use(cors({ origin: `${process.env.FRONTEND_DEV_URL}`, credentials: true }))

app.set('trust proxy', 1)

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: mongoStore.create({
            mongoUrl: `${process.env.START_MONGODB}${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}${process.env.END_MONGODB}`
        })
    })
)

app.use(passport.initialize())
app.use(passport.session())

passport.use(discordStrategy)
passport.use(gitHubStrategy)
passport.use(twitterStrategy)

passport.serializeUser((user: IDatabaseUser, cb) => {
    cb(null, user._id)
})

passport.deserializeUser((id: string, cb) => {
    User.findById({ _id: id }, (err: Error, user: IDatabaseUser) => {
        cb(err, user)
    })
})

app.get('/twitterfollow', async (req: IReqAuth, res) => {
    try {
        console.log(`User '${req.user.twitter.username}' is a about to follow someone`)

        const twitter = new Twitter({
            consumer_key: process.env.TWITTER_CONSUMER_KEY,
            consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
            access_token: req.user.twitter.token,
            access_token_secret: req.user.twitter.tokenSecret,
        });

        await twitter.post('friendships/create', req.query)

    } catch (e) {
        console.log(e)
    }
});

app.get('/getuser', (req, res) => {
    res.send(req.user)
})

app.get('/getallusers', async (req, res) => {
    await User.find({ gitHubConnected: true, twitterConnected: true }, (err: Error, data: IUser[]) => {
        if (err) throw err;
        const filteredUsers: IUser[] = [];
        data.forEach((user: IUser) => {
            const userInformation = {
                gitHubConnected: user.gitHubConnected,
                twitterConnected: user.twitterConnected,
                discord: {
                    id: user.discord.id,
                    username: user.discord.username,
                    avatar: user.discord.avatar,
                    discriminator: user.discord.discriminator,
                    banner: user.discord.banner,
                    banner_color: user.discord.banner_color
                },
                github: {
                    id: user.github.id,
                    json: {
                        login: user.github.json.login,
                        avatar_url: user.github.json.avatar_url,
                        html_url: user.github.json.html_url,
                        followers_url: user.github.json.followers_url,
                        following_url: user.github.json.following_url,
                        name: user.github.json.name,
                        company: user.github.json.company,
                        hireable: user.github.json.hireable,
                        blog: user.github.json.blog,
                        location: user.github.json.location,
                        bio: user.github.json.bio,
                        twitter_username: user.github.json.twitter_username,
                        followers: user.github.json.followers,
                        following: user.github.json.following,
                    }
                },
                twitter: {
                    id: user.twitter.id,
                    username: user.twitter.username,
                }
            }
            filteredUsers.push(userInformation);
        })
        res.send(filteredUsers);
    }).clone().catch(function (err: Error) { console.log(err) });
})

app.use('/api', routes)

const PORT = process.env.PORT || process.env.BACKEND_DEV_PORT

app.listen(PORT, () => {
    console.log(`server started on port ${PORT}`)
})