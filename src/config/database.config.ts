import {registerAs} from '@nestjs/config'
import dotenv from 'dotenv'
dotenv.config({quiet: true});
//dang ky truong dadtabase cvho config de databasemodule su edung
export default registerAs('database',()=>({
    dialect: 'mysql' as const,
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT!,10),
    username: process.env.DB_USER!,
    password: process.env.DB_PASS!,
    database: process.env.DB_NAME! 
}));