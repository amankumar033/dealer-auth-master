import AuthLayout from '@/app/components/auth/AuthLayout';
import AuthForm from '@/app/components/auth/AuthForm';

const SignInPage = () => {
  return (
    <AuthLayout 
      title="Dealer Sign In" 
      description="Sign in to your Dealer account"
    >
      <AuthForm />
    </AuthLayout>
  );
};

export default SignInPage;