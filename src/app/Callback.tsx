import { useEffect } from 'react';
import { useParams } from 'react-router';

export default function Callback() {
  let { provider } = useParams();
  useEffect(() => {
    window.location.href = `/api/auth/${provider}/callback${window.location.search}`;
  }, [provider]);
  return (
    <p>Redirecting...</p>
  )
}