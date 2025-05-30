import { useRouter } from 'next/router'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { GetServerSidePropsContext } from 'next'
import PageLayout from '../components/PageLayout'
import FileListing from '../components/FileListing'

export default function Pages() {
  const { query } = useRouter()

  return (
    <PageLayout query={query}>
      <FileListing query={query} />
    </PageLayout>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const locale = context.req.cookies.locale || 'en-US'
  
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  }
} 