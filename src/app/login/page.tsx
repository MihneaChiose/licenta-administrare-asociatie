import { loginAction } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow">
        <h1 className="text-2xl font-bold text-gray-900">Autentificare</h1>

        <p className="mt-2 text-sm text-gray-600">
          Intra in platforma de administrare a asociatiei.
        </p>

        {params.error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {params.error}
          </div>
        )}

        <form action={loginAction} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              name="email"
              type="email"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
              placeholder="admin@test.com"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Parola</label>
            <input
              name="password"
              type="password"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
              placeholder="admin123"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-black px-4 py-2 font-medium text-white hover:bg-gray-800"
          >
            Intra in cont
          </button>
        </form>

        <div className="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
          <p className="font-medium">Conturi de test:</p>
          <p>Admin: admin@test.com / admin123</p>
          <p>Locatar: locatar@test.com / locatar123</p>
        </div>
      </div>
    </main>
  );
}
