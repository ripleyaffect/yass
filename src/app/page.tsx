import { Card, CardContent, CardHeader } from '~/components/ui/card';

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-between p-24">
      <Card className="w-[400px]">
        <CardHeader className="text-lg">
          Hello, World
        </CardHeader>
        <CardContent>
          <p>
            This is a starter kit for Next.js projects, created by{' '}
            <a
              className="underline"
              href="https://github.com/ripleyaffect"
            >
              Ripley
            </a>.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
