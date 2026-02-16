'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Search, PlusCircle, User } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-primary">
          MinAle
        </Link>

        <nav className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost">Browse</Button>
          </Link>
          {user ? (
            <>
              <Link href="/dashboard">
                <Button variant="ghost">My Submissions</Button>
              </Link>
              <Link href="/submit">
                <Button className="gap-2">
                  <PlusCircle size={18} />
                  Submit Place
                </Button>
              </Link>
              <Button variant="outline" onClick={logout}>Logout</Button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="outline" className="gap-2">
                <User size={18} />
                Login
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
