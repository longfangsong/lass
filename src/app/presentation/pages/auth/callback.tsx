import { useEffect } from "react";
import { useParams } from "react-router";

export default function Callback() {
  const { provider } = useParams();
  useEffect(() => {
    console.log("Callback");
    window.location.href = `/api/auth/callback/${provider}${window.location.search}`;
  }, [provider]);
  return (
    <div>
      <p>Redirecting...</p>
    </div>
  );
}
