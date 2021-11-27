import { GetStaticPaths, GetStaticProps } from 'next';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { useRouter } from 'next/router';
import Head  from 'next/head';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const totalWords = post.data.content.reduce((total, contentItem) => {
    total += contentItem.heading.split(' ').length;
    const words = contentItem.body.map(item => item.text.split(' ').length);
    words.map(word => (total += word));
    return total;
  }, 0)

  const readTime = Math.ceil(totalWords/200);
  const router = useRouter();

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  const formattedDate = format(
    new Date(post.first_publication_date), 'dd LLL yyyy', {
      locale: ptBR
    })

  return (
    <>
    <Head><title>{`${post.data.title} | Spacetraveling.`}</title></Head>
      <header className={styles.banner}>
        <img src={post.data.banner.url} alt="imagem" />
      </header>
      <main className={commonStyles.container}>
        <div className={styles.post}>
          <div className={styles.postHeader}>
            <h1>{post.data.title}</h1>
            <ul>
              <li>
                <FiCalendar size={'1.25rem'} />
                <span>
                  <time> {formattedDate} </time>
                </span>
              </li>
              <li>
                <FiUser size={'1.25rem'} /> <span>{post.data.author}</span>
              </li>
              <li>
                <FiClock size={'1.25rem'} /> <span>{`${readTime} min`}</span>
              </li>
            </ul>
          </div>

            {post.data.content.map(content => {
              return (
                <article key={content.heading}>
                  <h2>{content.heading}</h2>
                  <div
                    className="styles.postContent"
                    dangerouslySetInnerHTML={{
                      __html: RichText.asHtml(content.body)
                    }}
                  />
                </article>
              )
            })}

        </div>
      </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts'),
  ]);

  const paths = posts.results.map((post) => {
    return {
      params: {
        slug: post.uid
      }
    }
  });

  return {
    paths,
    fallback: true
  }
};

export const getStaticProps: GetStaticProps = async (context) => {
  const prismic = getPrismicClient();
  const slug = context.params.slug;
  const response = await prismic.getByUID('posts', String(slug), {});
  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        }
      })
    }
  }

  console.log(post)

  return {
    props: {
      post
    },
    redirect: 60 * 30, // 30 minutes
  }
};
