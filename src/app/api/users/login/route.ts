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

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User login
 *     description: Authenticate user with email and password, returns JWT token in cookie
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: strongPassword123!
 *     responses:
 *       200:
 *         description: Successfully logged in
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *             description: JWT token in httpOnly cookie (authToken)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 email:
 *                   type: string
 *                   example: "Email is required"
 *                 password:
 *                   type: string
 *                   example: "Password is required"
 *                 generalError:
 *                   type: string
 *                   example: "Email or Password is incorrect"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error [error details]"
 */
 
/** 
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         user_id:
 *           type: integer
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *         password:
 *           type: string
 */
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
        const user = await prisma.user.findUnique({
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
                        id: user.user_id, 
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

