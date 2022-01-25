import {
  tokenLists$,
  userPreferredListIds$,
  keeperDaoTokens$,
  listOfLists,
  tokens$,
  pools$,
  tokensNoBalance$,
  tokenListMerged$,
  poolTokens$,
  allPools$,
  apiTokens$,
} from 'services/observables/tokens';
import {
  setAllTokens,
  setApiTokens,
  setBntPrice,
  setKeeperDaoTokens,
  setTokenList,
  setTokenLists,
} from 'redux/bancor/bancor';
import { getTokenListLS, setTokenListLS } from 'utils/localStorage';
import { take } from 'rxjs/operators';
import {
  loadingBalances$,
  loadingLockedBnt$,
  loadingPositions$,
  loadingRewards$,
} from './user';
import { setLoadingBalances } from 'redux/user/user';
import { statistics$ } from 'services/observables/statistics';
import { setAllPools, setPools, setStats } from 'redux/bancor/pool';
import { bntPrice$ } from 'services/observables/bancor';
import {
  setLoadingLockedBnt,
  setLoadingPositions,
  setLoadingRewards,
  setLockedAvailableBNT,
  setPoolTokens,
  setProtectedPositions,
  setRewards,
} from 'redux/liquidity/liquidity';
import {
  lockedAvailableBnt$,
  protectedPositions$,
  rewards$,
} from './liquidity';

export const subscribeToObservables = (dispatch: any) => {
  tokenLists$.subscribe((tokenLists) => {
    dispatch(setTokenLists(tokenLists));
  });

  tokensNoBalance$
    .pipe(take(1))
    .toPromise()
    .then((tokenList) => dispatch(setTokenList(tokenList)));

  loadingBalances$.subscribe((loading) =>
    dispatch(setLoadingBalances(loading))
  );

  const userListIds = getTokenListLS();
  if (userListIds.length === 0) {
    const twoLists = [listOfLists[0].name, listOfLists[1].name];
    setTokenListLS(twoLists);
    userPreferredListIds$.next(twoLists);
  } else userPreferredListIds$.next(userListIds);

  tokens$.subscribe((tokenList) => {
    dispatch(setTokenList(tokenList));
  });

  tokenListMerged$.subscribe((tokenList) => {
    dispatch(setAllTokens(tokenList));
  });

  apiTokens$.subscribe((tokens) => {
    dispatch(setApiTokens(tokens));
  });

  keeperDaoTokens$.subscribe((keeperDaoTokens) => {
    dispatch(setKeeperDaoTokens(keeperDaoTokens));
  });

  pools$.subscribe((pools) => {
    dispatch(setPools(pools));
  });

  allPools$.subscribe((pools) => {
    dispatch(setAllPools(pools));
  });

  statistics$.subscribe((stats) => {
    dispatch(setStats(stats));
  });

  bntPrice$.subscribe((bntPrice) => {
    dispatch(setBntPrice(bntPrice));
  });

  protectedPositions$.subscribe((protectedPositions) => {
    dispatch(setProtectedPositions(protectedPositions));
  });

  rewards$.subscribe((rewards) => {
    dispatch(setRewards(rewards));
  });

  poolTokens$.subscribe((poolTokens) => dispatch(setPoolTokens(poolTokens)));

  lockedAvailableBnt$.subscribe((lockedAvailableBnt) => {
    if (lockedAvailableBnt) {
      dispatch(setLockedAvailableBNT(lockedAvailableBnt));
    }
  });

  loadingPositions$.subscribe((loadingPositions) =>
    dispatch(setLoadingPositions(loadingPositions))
  );
  loadingRewards$.subscribe((loadingRewards) =>
    dispatch(setLoadingRewards(loadingRewards))
  );
  loadingLockedBnt$.subscribe((loadingLockedBnt) =>
    dispatch(setLoadingLockedBnt(loadingLockedBnt))
  );
};
