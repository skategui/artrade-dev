import moment from 'moment';

export interface ElasticsearchSearchPagination {
  limit?: number;
  skip?: number;
}

export enum DateClampPolicy {
  None,
  TruncateToHour,
}

export interface SearchQueryOptions {
  // Results have a score boost if they are recent.
  // If two results have identical or similar creation time, they may obtain too similar scores, leading to a non-deterministic ES output.
  // In order to avoid this behavior, we can clamp the date to the dates hour, so that
  // each item gets the same exact score, and the ES output stays deterministic.
  recencyScoreBoostDateClampPolicy?: DateClampPolicy; // Default is TruncateToHour

  recencyScoreBoostDate?: Date; // Default is today.
  printScores?: boolean; // Default is false
}

export const clampDate = (date: Date, policy: DateClampPolicy): Date => {
  switch (policy) {
    case DateClampPolicy.None:
      return date;
    case DateClampPolicy.TruncateToHour:
      return new Date(moment().format('YYYY-MM-DD, h:00:00'));
  }
};
