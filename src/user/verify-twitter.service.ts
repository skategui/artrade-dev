import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';
import { AppLogger } from '../logging/logging.service';

@Injectable()
export class VerifyTwitterService {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext(this.constructor.name);
  }

  async verify(url: string, walletAddresses: string[]): Promise<boolean> {
    const tweetId = url.split('/').reverse()[0];
    const shortId = tweetId.split('?')[0];
    const response = await axios.get(`https://api.twitter.com/2/tweets?ids=${shortId}`, {
      headers: {
        Authorization: `Bearer ${process.env.TWITTER_TOKEN}`,
      },
    });
    this.logger.debug(`twitter api response data: ${JSON.stringify(response.data)}`);
    if (response.data.errors) {
      if (response.data.errors[0].title === 'Not Found Error') {
        throw new TweetNotFoundException();
      } else {
        throw new TwitterApiException();
      }
    }
    const tweetContent = response.data.data[0].text.split(' ');
    const predicate = (element: string) => walletAddresses.includes(element);
    const isVerified = tweetContent.some(predicate);
    return isVerified;
  }
}

export class TweetNotFoundException extends HttpException {
  constructor() {
    super(`Tweet not found on Twitter. Are you sure your tweet is public?`, HttpStatus.NOT_FOUND);
  }
}

export class TwitterApiException extends HttpException {
  constructor() {
    super(
      `An error occurred while trying to retrieve your tweet from Twitter Api`,
      HttpStatus.NOT_FOUND,
    );
  }
}
