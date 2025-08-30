import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

export default function Home(): JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title}`}
      description="Documentation">
      <main className="container margin-vert--lg">
        <div className="text--center">
          <Heading as="h1" className="hero__title">
            {siteConfig.title}
          </Heading>
          <p className="hero__subtitle">{siteConfig.tagline}</p>
          <div className="margin-top--lg">
            <a
              className="button button--secondary button--lg"
              href="/docs/intro">
              Get Started
            </a>
          </div>
        </div>
      </main>
    </Layout>
  );
}