import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      tier: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    tier?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    tier: string;
  }
}
