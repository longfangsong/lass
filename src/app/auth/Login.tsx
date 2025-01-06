  import { Button } from "flowbite-react";
  import { FaGithub, FaGoogle } from "react-icons/fa";

export default function Login() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <h1 className="text-2xl font-bold mb-4">Login With</h1>
      
      <Button
        onClick={() => window.location.href = '/api/auth/github/login'}
        className="w-64 flex items-center justify-center gap-2"
      >
        <FaGithub className="h-5 w-5" />
        <span className="pl-2">GitHub</span>
      </Button>

      <Button
        onClick={() => window.location.href = '/api/auth/google/login'}
        className="w-64 flex items-center justify-center gap-2"
      >
        <FaGoogle className="h-5 w-5" />
        <span className="pl-2">Google</span>
      </Button>
    </div>
  );
} 