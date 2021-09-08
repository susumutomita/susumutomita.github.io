import Container from './container';
import { EXAMPLE_PATH } from '../lib/constants';

const Footer = () => {
  return (
    <footer className='bg-accent-1 border-t border-accent-2'>
      <Container>
        <div className='py-28 flex flex-col lg:flex-row items-center'>
          <a
            href={`https://twitter.com/tonitoni415`}
            className='mx-3 font-bold hover:underline'
          >
            Twitter
          </a>
          <a
            href={`https://github.com/susumutomita`}
            className='mx-3 font-bold hover:underline'
          >
            GitHub
          </a>
          <a
            href={`https://www.linkedin.com/in/susumutomita/`}
            className='mx-3 font-bold hover:underline'
          >
            LinkedIn
          </a>
          <div className='flex flex-col lg:flex-row justify-center lg:pl-4 lg:w-1/2'>
            {`\u00a9 ${new Date().getFullYear()} Susumu Tomita`}
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
