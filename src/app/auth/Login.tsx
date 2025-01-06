import { Button } from "flowbite-react";
import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

export default function Login() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <h1 className="text-2xl font-bold mb-4">选择登录方式</h1>
      
      <Button
        onClick={() => window.location.href = '/api/auth/github/login'}
        className="w-64 flex items-center justify-center gap-2"
      >
        <FaGithub className="h-5 w-5" />
        使用 GitHub 登录
      </Button>

      <Button
        onClick={() => window.location.href = '/api/auth/google/login'}
        className="w-64 flex items-center justify-center gap-2"
      >
        <FcGoogle className="h-5 w-5" />
        使用 Google 登录
      </Button>
    </div>
  );
} 