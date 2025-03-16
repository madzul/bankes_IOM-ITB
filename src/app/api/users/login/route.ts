import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
// import { validateEmail, validatePassword } from "@/utils/_validation";

const prisma = new PrismaClient();


type Errors = {
    email?: string
    password?: string
    generalError?: string
}


export async function POST(req: Request){
    try{
        const { email, password } = await req.json(); 
        const errors: Errors = {}; 

        if(!email){
            errors.email = "Email is required"
            return NextResponse.json(errors, { status: 400 });
        }

        if(!password){
            errors.password = "Password is required"
            return NextResponse.json(errors, { status: 400 });
        }

        // find if user with email exists 
        const user = await prisma.users.findUnique({
            where: {
                email
            }
        });

        if(user){
            const match = await bcrypt.compare(password, user.password);
            if(match){

                /**
                 * 1. generate jwt token 
                 * 2. set token in cookie 
                 * 3. return user data
                 */
                
                const token = jwt.sign(
                    {
                        id: user.id, 
                        name: user.name, 
                        email: user.email,
                    },
                    process.env.JWT_SECRET!, 
                    {"expiresIn": "2h"}
                )

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { password: _, ...userWithoutPassword } = user;

                const response = NextResponse.json(
                    {user: userWithoutPassword},
                    {status: 200 }
                )

                response.cookies.set("authToken", token, {
                    httpOnly: true, 
                    maxAge: 60 * 60 * 2,
                    path: "/",
                    sameSite: "strict"
                })

                return response; 
            } else {
                errors.generalError = "Email or Password is incorrect";
                return NextResponse.json(errors, { status: 400 });
            }
        }else{
            errors.generalError = "Email or Password is incorrect";
            return NextResponse.json(errors, { status: 400 });
        }


    } catch(error) {
        return NextResponse.json({error: `Internal server error ${error}` }, { status: 500});
    }
}

