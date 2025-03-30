import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import {
  validateEmail, 
  validatePassword, 
  
} from "@/utils/_validation";


const prisma = new PrismaClient();

type Errors = {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
  general?: string[]
}

export async function POST(req: Request) {
  try {
    const { name, email, password, confirmPassword } = await req.json();
    const errors: Errors = {};

    if(!name) {
      errors.name = "Name is required"
      return NextResponse.json(errors, { status: 400 });
    }

    if(!email){
      errors.email = "Email is required"
      return NextResponse.json(errors, { status: 400 });
    }

    const emailError = validateEmail(email); 
    if(emailError){
      errors.email = emailError;
      return NextResponse.json(errors, { status: 400 });
    }

    if(!password){
      errors.password = "Password is required"
      return NextResponse.json(errors, { status: 400 });
    }

    const passwordError = validatePassword(password); 
    if(passwordError){
      errors.password = passwordError
      return NextResponse.json(errors, { status: 400 });
    }

    if(!confirmPassword){
      errors.confirmPassword = "Confirm Password is required"
      return NextResponse.json(errors, { status: 400 });
    }

    if (password !== confirmPassword){
      errors.confirmPassword = "Password and Confirm Password must be same."
      return NextResponse.json(errors, { status: 400 });
    }
    
    // hash the password before saving it to the database
    const saltRounds = 10; 
    const hashedPassword = await bcrypt.hash(password, saltRounds); 

    // check the email is already registered or not 
    const isUserExists = await prisma.user.findFirst({
      where: {
        email: email
      }
    })

    if(isUserExists){
      errors.email = "Email already registered. If you feel wrong contact the admin"
      return NextResponse.json(errors, { status: 400 });
    }

    const newUser = await prisma.user.create({
      data:{
        name: name, 
        email: email, 
        password: hashedPassword,
        role: "Guest"
      }
    });

    /**
     * this is the response that will be sent to the client 
     * after the user is successfully created
     * 
     * it will redirect the user to the login page 
     */

    if (!newUser) {
      errors.general = ["Failed to create user"];
      return NextResponse.json(errors, { status: 400 });
    }
    else{
      return NextResponse.redirect(new URL('/auth/login', req.url), {
        status: 302
      });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create user." }, { status: 500 });
  }
}
