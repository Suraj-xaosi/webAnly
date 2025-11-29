import LoginPage from '../../components/LoginPage';
import { authOptions } from "../../lib/auth";
;
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import React from 'react';

export default async function Login() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect('/');
  }
  return <LoginPage/>;
};
