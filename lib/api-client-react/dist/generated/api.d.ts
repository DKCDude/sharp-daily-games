import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import type { AuthUserState, CrossnumbersHistoryResponse, CrossnumbersLeaderboardResponse, CrossnumbersProgress, CrossnumbersProgressAck, CrossnumbersPuzzle, CrossnumbersReminderPrefs, CrossnumbersState, CrossnumbersStatsResponse, CrossnumbersSubmission, CrossnumbersSubmitResult, GameState, GlobalStatsResponse, GuessOutcome, GuessSubmission, HealthStatus, LeaderboardResponse, MobileAuthExchangeRequest, MobileAuthExchangeResponse, MobileLogoutResult, StreakHistoryResponse, TodayWordResponse } from "./api.schemas";
import { customFetch } from "../custom-fetch";
import type { ErrorType, BodyType } from "../custom-fetch";
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
/**
 * @summary Health check
 */
export declare const getHealthCheckUrl: () => string;
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get current authenticated user
 */
export declare const getGetCurrentAuthUserUrl: () => string;
export declare const getCurrentAuthUser: (options?: RequestInit) => Promise<AuthUserState>;
export declare const getGetCurrentAuthUserQueryKey: () => readonly ["/api/auth/user"];
export declare const getGetCurrentAuthUserQueryOptions: <TData = Awaited<ReturnType<typeof getCurrentAuthUser>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCurrentAuthUser>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCurrentAuthUser>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCurrentAuthUserQueryResult = NonNullable<Awaited<ReturnType<typeof getCurrentAuthUser>>>;
export type GetCurrentAuthUserQueryError = ErrorType<unknown>;
/**
 * @summary Get current authenticated user
 */
export declare function useGetCurrentAuthUser<TData = Awaited<ReturnType<typeof getCurrentAuthUser>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCurrentAuthUser>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Exchange mobile OIDC authorization code for a session token
 */
export declare const getExchangeMobileAuthorizationCodeUrl: () => string;
export declare const exchangeMobileAuthorizationCode: (mobileAuthExchangeRequest: MobileAuthExchangeRequest, options?: RequestInit) => Promise<MobileAuthExchangeResponse>;
export declare const getExchangeMobileAuthorizationCodeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof exchangeMobileAuthorizationCode>>, TError, {
        data: BodyType<MobileAuthExchangeRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof exchangeMobileAuthorizationCode>>, TError, {
    data: BodyType<MobileAuthExchangeRequest>;
}, TContext>;
export type ExchangeMobileAuthorizationCodeMutationResult = NonNullable<Awaited<ReturnType<typeof exchangeMobileAuthorizationCode>>>;
export type ExchangeMobileAuthorizationCodeMutationBody = BodyType<MobileAuthExchangeRequest>;
export type ExchangeMobileAuthorizationCodeMutationError = ErrorType<unknown>;
/**
 * @summary Exchange mobile OIDC authorization code for a session token
 */
export declare const useExchangeMobileAuthorizationCode: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof exchangeMobileAuthorizationCode>>, TError, {
        data: BodyType<MobileAuthExchangeRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof exchangeMobileAuthorizationCode>>, TError, {
    data: BodyType<MobileAuthExchangeRequest>;
}, TContext>;
/**
 * @summary Mobile logout — deletes the session
 */
export declare const getLogoutMobileSessionUrl: () => string;
export declare const logoutMobileSession: (options?: RequestInit) => Promise<MobileLogoutResult>;
export declare const getLogoutMobileSessionMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logoutMobileSession>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof logoutMobileSession>>, TError, void, TContext>;
export type LogoutMobileSessionMutationResult = NonNullable<Awaited<ReturnType<typeof logoutMobileSession>>>;
export type LogoutMobileSessionMutationError = ErrorType<unknown>;
/**
 * @summary Mobile logout — deletes the session
 */
export declare const useLogoutMobileSession: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logoutMobileSession>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof logoutMobileSession>>, TError, void, TContext>;
/**
 * @summary Get the word of the day (only revealed during the reveal phase)
 */
export declare const getGetTodayWordUrl: () => string;
export declare const getTodayWord: (options?: RequestInit) => Promise<TodayWordResponse>;
export declare const getGetTodayWordQueryKey: () => readonly ["/api/game/today"];
export declare const getGetTodayWordQueryOptions: <TData = Awaited<ReturnType<typeof getTodayWord>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTodayWord>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getTodayWord>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetTodayWordQueryResult = NonNullable<Awaited<ReturnType<typeof getTodayWord>>>;
export type GetTodayWordQueryError = ErrorType<unknown>;
/**
 * @summary Get the word of the day (only revealed during the reveal phase)
 */
export declare function useGetTodayWord<TData = Awaited<ReturnType<typeof getTodayWord>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTodayWord>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get the player's full game state for today
 */
export declare const getGetGameStateUrl: () => string;
export declare const getGameState: (options?: RequestInit) => Promise<GameState>;
export declare const getGetGameStateQueryKey: () => readonly ["/api/game/state"];
export declare const getGetGameStateQueryOptions: <TData = Awaited<ReturnType<typeof getGameState>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getGameState>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getGameState>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetGameStateQueryResult = NonNullable<Awaited<ReturnType<typeof getGameState>>>;
export type GetGameStateQueryError = ErrorType<unknown>;
/**
 * @summary Get the player's full game state for today
 */
export declare function useGetGameState<TData = Awaited<ReturnType<typeof getGameState>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getGameState>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Mark that the player has started viewing today's word (begins the reveal timer)
 */
export declare const getStartRevealUrl: () => string;
export declare const startReveal: (options?: RequestInit) => Promise<GameState>;
export declare const getStartRevealMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof startReveal>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof startReveal>>, TError, void, TContext>;
export type StartRevealMutationResult = NonNullable<Awaited<ReturnType<typeof startReveal>>>;
export type StartRevealMutationError = ErrorType<unknown>;
/**
 * @summary Mark that the player has started viewing today's word (begins the reveal timer)
 */
export declare const useStartReveal: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof startReveal>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof startReveal>>, TError, void, TContext>;
/**
 * @summary Submit the player's full sequence of recalled words for today
 */
export declare const getSubmitGuessUrl: () => string;
export declare const submitGuess: (guessSubmission: GuessSubmission, options?: RequestInit) => Promise<GuessOutcome>;
export declare const getSubmitGuessMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof submitGuess>>, TError, {
        data: BodyType<GuessSubmission>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof submitGuess>>, TError, {
    data: BodyType<GuessSubmission>;
}, TContext>;
export type SubmitGuessMutationResult = NonNullable<Awaited<ReturnType<typeof submitGuess>>>;
export type SubmitGuessMutationBody = BodyType<GuessSubmission>;
export type SubmitGuessMutationError = ErrorType<unknown>;
/**
 * @summary Submit the player's full sequence of recalled words for today
 */
export declare const useSubmitGuess: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof submitGuess>>, TError, {
        data: BodyType<GuessSubmission>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof submitGuess>>, TError, {
    data: BodyType<GuessSubmission>;
}, TContext>;
/**
 * @summary Get the list of words from the player's current streak (in order)
 */
export declare const getGetStreakHistoryUrl: () => string;
export declare const getStreakHistory: (options?: RequestInit) => Promise<StreakHistoryResponse>;
export declare const getGetStreakHistoryQueryKey: () => readonly ["/api/game/history"];
export declare const getGetStreakHistoryQueryOptions: <TData = Awaited<ReturnType<typeof getStreakHistory>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStreakHistory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getStreakHistory>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetStreakHistoryQueryResult = NonNullable<Awaited<ReturnType<typeof getStreakHistory>>>;
export type GetStreakHistoryQueryError = ErrorType<unknown>;
/**
 * @summary Get the list of words from the player's current streak (in order)
 */
export declare function useGetStreakHistory<TData = Awaited<ReturnType<typeof getStreakHistory>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStreakHistory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Top players by longest streak and current streak
 */
export declare const getGetLeaderboardUrl: () => string;
export declare const getLeaderboard: (options?: RequestInit) => Promise<LeaderboardResponse>;
export declare const getGetLeaderboardQueryKey: () => readonly ["/api/leaderboard"];
export declare const getGetLeaderboardQueryOptions: <TData = Awaited<ReturnType<typeof getLeaderboard>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getLeaderboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getLeaderboard>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetLeaderboardQueryResult = NonNullable<Awaited<ReturnType<typeof getLeaderboard>>>;
export type GetLeaderboardQueryError = ErrorType<unknown>;
/**
 * @summary Top players by longest streak and current streak
 */
export declare function useGetLeaderboard<TData = Awaited<ReturnType<typeof getLeaderboard>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getLeaderboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Global stats for the wow surface
 */
export declare const getGetGlobalStatsUrl: () => string;
export declare const getGlobalStats: (options?: RequestInit) => Promise<GlobalStatsResponse>;
export declare const getGetGlobalStatsQueryKey: () => readonly ["/api/stats"];
export declare const getGetGlobalStatsQueryOptions: <TData = Awaited<ReturnType<typeof getGlobalStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getGlobalStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getGlobalStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetGlobalStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getGlobalStats>>>;
export type GetGlobalStatsQueryError = ErrorType<unknown>;
/**
 * @summary Global stats for the wow surface
 */
export declare function useGetGlobalStats<TData = Awaited<ReturnType<typeof getGlobalStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getGlobalStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Player's Crossnumbers state for today (streak, attempt status)
 */
export declare const getGetCrossnumbersStateUrl: () => string;
export declare const getCrossnumbersState: (options?: RequestInit) => Promise<CrossnumbersState>;
export declare const getGetCrossnumbersStateQueryKey: () => readonly ["/api/crossnumbers/state"];
export declare const getGetCrossnumbersStateQueryOptions: <TData = Awaited<ReturnType<typeof getCrossnumbersState>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCrossnumbersState>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCrossnumbersState>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCrossnumbersStateQueryResult = NonNullable<Awaited<ReturnType<typeof getCrossnumbersState>>>;
export type GetCrossnumbersStateQueryError = ErrorType<unknown>;
/**
 * @summary Player's Crossnumbers state for today (streak, attempt status)
 */
export declare function useGetCrossnumbersState<TData = Awaited<ReturnType<typeof getCrossnumbersState>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCrossnumbersState>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Today's Crossnumbers puzzle (grid skeleton + clues, no answers)
 */
export declare const getGetCrossnumbersPuzzleUrl: () => string;
export declare const getCrossnumbersPuzzle: (options?: RequestInit) => Promise<CrossnumbersPuzzle>;
export declare const getGetCrossnumbersPuzzleQueryKey: () => readonly ["/api/crossnumbers/puzzle"];
export declare const getGetCrossnumbersPuzzleQueryOptions: <TData = Awaited<ReturnType<typeof getCrossnumbersPuzzle>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCrossnumbersPuzzle>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCrossnumbersPuzzle>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCrossnumbersPuzzleQueryResult = NonNullable<Awaited<ReturnType<typeof getCrossnumbersPuzzle>>>;
export type GetCrossnumbersPuzzleQueryError = ErrorType<unknown>;
/**
 * @summary Today's Crossnumbers puzzle (grid skeleton + clues, no answers)
 */
export declare function useGetCrossnumbersPuzzle<TData = Awaited<ReturnType<typeof getCrossnumbersPuzzle>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCrossnumbersPuzzle>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Autosave the player's in-progress grid for today
 */
export declare const getSaveCrossnumbersProgressUrl: () => string;
export declare const saveCrossnumbersProgress: (crossnumbersProgress: CrossnumbersProgress, options?: RequestInit) => Promise<CrossnumbersProgressAck>;
export declare const getSaveCrossnumbersProgressMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof saveCrossnumbersProgress>>, TError, {
        data: BodyType<CrossnumbersProgress>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof saveCrossnumbersProgress>>, TError, {
    data: BodyType<CrossnumbersProgress>;
}, TContext>;
export type SaveCrossnumbersProgressMutationResult = NonNullable<Awaited<ReturnType<typeof saveCrossnumbersProgress>>>;
export type SaveCrossnumbersProgressMutationBody = BodyType<CrossnumbersProgress>;
export type SaveCrossnumbersProgressMutationError = ErrorType<unknown>;
/**
 * @summary Autosave the player's in-progress grid for today
 */
export declare const useSaveCrossnumbersProgress: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof saveCrossnumbersProgress>>, TError, {
        data: BodyType<CrossnumbersProgress>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof saveCrossnumbersProgress>>, TError, {
    data: BodyType<CrossnumbersProgress>;
}, TContext>;
/**
 * @summary Submit the player's filled grid for today
 */
export declare const getSubmitCrossnumbersUrl: () => string;
export declare const submitCrossnumbers: (crossnumbersSubmission: CrossnumbersSubmission, options?: RequestInit) => Promise<CrossnumbersSubmitResult>;
export declare const getSubmitCrossnumbersMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof submitCrossnumbers>>, TError, {
        data: BodyType<CrossnumbersSubmission>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof submitCrossnumbers>>, TError, {
    data: BodyType<CrossnumbersSubmission>;
}, TContext>;
export type SubmitCrossnumbersMutationResult = NonNullable<Awaited<ReturnType<typeof submitCrossnumbers>>>;
export type SubmitCrossnumbersMutationBody = BodyType<CrossnumbersSubmission>;
export type SubmitCrossnumbersMutationError = ErrorType<unknown>;
/**
 * @summary Submit the player's filled grid for today
 */
export declare const useSubmitCrossnumbers: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof submitCrossnumbers>>, TError, {
        data: BodyType<CrossnumbersSubmission>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof submitCrossnumbers>>, TError, {
    data: BodyType<CrossnumbersSubmission>;
}, TContext>;
/**
 * @summary Recent solve history for the player
 */
export declare const getGetCrossnumbersHistoryUrl: () => string;
export declare const getCrossnumbersHistory: (options?: RequestInit) => Promise<CrossnumbersHistoryResponse>;
export declare const getGetCrossnumbersHistoryQueryKey: () => readonly ["/api/crossnumbers/history"];
export declare const getGetCrossnumbersHistoryQueryOptions: <TData = Awaited<ReturnType<typeof getCrossnumbersHistory>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCrossnumbersHistory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCrossnumbersHistory>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCrossnumbersHistoryQueryResult = NonNullable<Awaited<ReturnType<typeof getCrossnumbersHistory>>>;
export type GetCrossnumbersHistoryQueryError = ErrorType<unknown>;
/**
 * @summary Recent solve history for the player
 */
export declare function useGetCrossnumbersHistory<TData = Awaited<ReturnType<typeof getCrossnumbersHistory>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCrossnumbersHistory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Top Crossnumbers players (current streak, longest streak, best time today)
 */
export declare const getGetCrossnumbersLeaderboardUrl: () => string;
export declare const getCrossnumbersLeaderboard: (options?: RequestInit) => Promise<CrossnumbersLeaderboardResponse>;
export declare const getGetCrossnumbersLeaderboardQueryKey: () => readonly ["/api/crossnumbers/leaderboard"];
export declare const getGetCrossnumbersLeaderboardQueryOptions: <TData = Awaited<ReturnType<typeof getCrossnumbersLeaderboard>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCrossnumbersLeaderboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCrossnumbersLeaderboard>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCrossnumbersLeaderboardQueryResult = NonNullable<Awaited<ReturnType<typeof getCrossnumbersLeaderboard>>>;
export type GetCrossnumbersLeaderboardQueryError = ErrorType<unknown>;
/**
 * @summary Top Crossnumbers players (current streak, longest streak, best time today)
 */
export declare function useGetCrossnumbersLeaderboard<TData = Awaited<ReturnType<typeof getCrossnumbersLeaderboard>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCrossnumbersLeaderboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Global Crossnumbers stats (players, solves today, avg time)
 */
export declare const getGetCrossnumbersStatsUrl: () => string;
export declare const getCrossnumbersStats: (options?: RequestInit) => Promise<CrossnumbersStatsResponse>;
export declare const getGetCrossnumbersStatsQueryKey: () => readonly ["/api/crossnumbers/stats"];
export declare const getGetCrossnumbersStatsQueryOptions: <TData = Awaited<ReturnType<typeof getCrossnumbersStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCrossnumbersStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCrossnumbersStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCrossnumbersStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getCrossnumbersStats>>>;
export type GetCrossnumbersStatsQueryError = ErrorType<unknown>;
/**
 * @summary Global Crossnumbers stats (players, solves today, avg time)
 */
export declare function useGetCrossnumbersStats<TData = Awaited<ReturnType<typeof getCrossnumbersStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCrossnumbersStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Get the player's daily-reminder preferences
 */
export declare const getGetCrossnumbersReminderUrl: () => string;
export declare const getCrossnumbersReminder: (options?: RequestInit) => Promise<CrossnumbersReminderPrefs>;
export declare const getGetCrossnumbersReminderQueryKey: () => readonly ["/api/crossnumbers/reminder"];
export declare const getGetCrossnumbersReminderQueryOptions: <TData = Awaited<ReturnType<typeof getCrossnumbersReminder>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCrossnumbersReminder>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCrossnumbersReminder>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCrossnumbersReminderQueryResult = NonNullable<Awaited<ReturnType<typeof getCrossnumbersReminder>>>;
export type GetCrossnumbersReminderQueryError = ErrorType<unknown>;
/**
 * @summary Get the player's daily-reminder preferences
 */
export declare function useGetCrossnumbersReminder<TData = Awaited<ReturnType<typeof getCrossnumbersReminder>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCrossnumbersReminder>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
/**
 * @summary Update the player's daily-reminder preferences
 */
export declare const getUpdateCrossnumbersReminderUrl: () => string;
export declare const updateCrossnumbersReminder: (crossnumbersReminderPrefs: CrossnumbersReminderPrefs, options?: RequestInit) => Promise<CrossnumbersReminderPrefs>;
export declare const getUpdateCrossnumbersReminderMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateCrossnumbersReminder>>, TError, {
        data: BodyType<CrossnumbersReminderPrefs>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateCrossnumbersReminder>>, TError, {
    data: BodyType<CrossnumbersReminderPrefs>;
}, TContext>;
export type UpdateCrossnumbersReminderMutationResult = NonNullable<Awaited<ReturnType<typeof updateCrossnumbersReminder>>>;
export type UpdateCrossnumbersReminderMutationBody = BodyType<CrossnumbersReminderPrefs>;
export type UpdateCrossnumbersReminderMutationError = ErrorType<unknown>;
/**
 * @summary Update the player's daily-reminder preferences
 */
export declare const useUpdateCrossnumbersReminder: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateCrossnumbersReminder>>, TError, {
        data: BodyType<CrossnumbersReminderPrefs>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateCrossnumbersReminder>>, TError, {
    data: BodyType<CrossnumbersReminderPrefs>;
}, TContext>;
export {};
//# sourceMappingURL=api.d.ts.map