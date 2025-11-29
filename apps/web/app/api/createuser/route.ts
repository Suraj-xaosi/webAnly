import { NextResponse } from 'next/server';


import  prisma from "@repo/db"

export async function POST(request: Request) {
	
	try {
		const body = await request.json();
		console.log(body);
		const { name, email, password } = body;

		if (!name || !email || !password) {
			return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
		}

		// Check if user already exists
		console.log("going to hit prisma")
		const existingUser = await prisma.user.findUnique({
			where: { email },
		});
		console.log("hitted prisma")
		if (existingUser) {
			return NextResponse.json({ error: 'User already exists' }, { status: 409 });
		}

		// Create user
		const user = await prisma.user.create({
			data: {
				name,
				email,
				password, // In production, hash the password before storing
			},
		});

		return NextResponse.json({ user }, { status: 201 });
	} catch (error) {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
