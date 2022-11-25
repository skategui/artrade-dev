const stepCount = 10;

export class BatchJobLogger {
  private processedCount = 0;
  private nextThresholdToLog: number;
  private stepSize: number;

  constructor(
    private jobName: string,
    private totalCount: number,
    private logger: (msg: string) => void = console.log,
  ) {
    this.stepSize = Math.floor(totalCount / stepCount);
    this.nextThresholdToLog = this.stepSize;
  }

  logInitial(): void {
    this.logger(`${this.jobName}: ${this.totalCount} items. Starting:`);
  }

  logBatch(processedCountInThisBatch: number): void {
    this.processedCount += processedCountInThisBatch;
    if (this.processedCount >= this.nextThresholdToLog) {
      this.nextThresholdToLog = this.nextThresholdToLog + this.stepSize;
      this.logger(`${this.jobName}: ${this.processedCount}/${this.totalCount}`);
    }
  }

  logFinal(): void {
    this.logger(`${this.jobName}: Finished.`);
  }
}
