
export interface TimeStrike {
  blockHeight: number;
  nLockTime: number;
  creationTime: number;
};

export interface SlowFastGuess {
  guess : "slow" | "fast";
  blockHeight: number;
  nLockTime: number;
  creationTime: number;
  userName: string;
  userId: number;
}

