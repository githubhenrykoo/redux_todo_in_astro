class TimeTracker {
  private sessionStartTime: number | null = null;

  startSession() {
    this.sessionStartTime = Date.now();
    console.log('Session tracking started');
  }

  endSession() {
    if (this.sessionStartTime) {
      const duration = Date.now() - this.sessionStartTime;
      console.log(`Session ended. Duration: ${duration}ms`);
      this.sessionStartTime = null;
    }
  }
}

export const timeTracker = new TimeTracker();
