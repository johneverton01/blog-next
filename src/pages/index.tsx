import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { FiUser, FiCalendar } from 'react-icons/fi'
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { useState } from 'react';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {

  const formattedPosts = (posts:Post[]) => {
    return posts.map(post => {
      return {
        uid: post.uid,
        first_publication_date: format(
          new Date(post.first_publication_date), 'dd LLL yyyy', {
          locale: ptBR
        }),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        }
      }
    });
  }

  const [posts, setPosts] = useState<Post[]>(formattedPosts(postsPagination.results));
  const [nextPage, setNextPage] = useState<string | null>(postsPagination.next_page);
  const [currentPage, setCurrentPage] = useState<number>(1);

  async function handleNextPage(): Promise<void> {
    if (currentPage !== 1 && nextPage === null) {
      return;
    }

    const postsResult = await fetch(`${nextPage}`).then(response =>
      response.json()
    );

    setNextPage(postsResult.next_page);
    setCurrentPage(postsResult.page);

    const newPosts = formattedPosts(postsResult.results);

    setPosts([...posts, ...newPosts])

  }

  return (
    <>
      <Head><title>Home | Spacetraveling.</title></Head>
      <main className={commonStyles.container}>
        <div className={styles.post}>
          {posts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <h1>{post.data.title}</h1>
                <p>{post.data.subtitle}</p>
                <ul>
                  <li>
                    <FiCalendar size={'1.25rem'} />
                    <span>
                      <time> {post.first_publication_date} </time>
                    </span>
                  </li>
                  <li>
                    <FiUser size={'1.25rem'} /> <span>{post.data.author}</span>
                  </li>
                </ul>
              </a>
            </Link>
          ))}
          {nextPage && (
            <button type="button" onClick={handleNextPage}>Carregar mais posts</button>
          )}
        </div>
      </main>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')], {
    fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
    pageSize: 1,
  }
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      }
    }
  });

  return {
    props: {
      postsPagination: {
        results: posts,
        next_page: postsResponse.next_page
      }
    }
  }

};
