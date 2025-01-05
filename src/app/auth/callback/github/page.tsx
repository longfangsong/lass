"use client";

import { useRouter } from 'next/router'
import { useEffect } from 'react';
 
export default function Page() {
  useEffect(() => {
    window.location.href = '/api/auth/github/callback' + window.location.search;
  }, []);
  return (
    <p>Redirecting...</p>
  )
}