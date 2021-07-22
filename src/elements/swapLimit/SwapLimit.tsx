import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'utils/dayjs';
import BigNumber from 'bignumber.js';
import { InputField } from 'components/inputField/InputField';
import { TokenInputField } from 'components/tokenInputField/TokenInputField';
import { ModalDuration } from 'elements/modalDuration/modalDuration';
import { TokenListItem } from 'services/observables/tokens';
import { ReactComponent as IconSync } from 'assets/icons/sync.svg';
import {
  calculatePercentageChange,
  classNameGenerator,
} from 'utils/pureFunctions';
import { useInterval } from 'hooks/useInterval';
import { getRate } from 'services/web3/swap/methods';
import usePrevious from 'hooks/usePrevious';
import { swapLimit } from 'services/api/keeperDao';
import {
  addNotification,
  NotificationType,
} from 'redux/notification/notification';
import { useDispatch } from 'react-redux';
import { useWeb3React } from '@web3-react/core';
import { ethToken, wethToken } from 'services/web3/config';
import { useAppSelector } from 'redux/index';
import { openWalletModal } from 'redux/user/user';
import { ModalApprove } from 'elements/modalApprove/modalApprove';
import { getNetworkContractApproval } from 'services/web3/approval';
import { Modal } from 'components/modal/Modal';
import { prettifyNumber } from 'utils/helperFunctions';

enum Field {
  from,
  to,
  rate,
}

interface SwapLimitProps {
  fromToken: TokenListItem;
  setFromToken: Function;
  toToken: TokenListItem | null;
  setToToken: Function;
  switchTokens: Function;
}

export const SwapLimit = ({
  fromToken,
  setFromToken,
  toToken,
  setToToken,
  switchTokens,
}: SwapLimitProps) => {
  const dispatch = useDispatch();
  const { account } = useWeb3React();
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [toAmountUsd, setToAmountUsd] = useState('');
  const [fromAmountUsd, setFromAmountUsd] = useState('');
  const [rate, setRate] = useState('');
  const [marketRate, setMarketRate] = useState(-1);
  const prevMarket = usePrevious(marketRate);
  const [percentage, setPercentage] = useState('');
  const [selPercentage, setSelPercentage] = useState(1);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showEthModal, setShowEthModal] = useState(false);
  const [disableSwap, setDisableSwap] = useState(false);
  const [duration, setDuration] = useState(
    dayjs.duration({ days: 7, hours: 0, minutes: 0 })
  );
  const previousField = useRef<Field>();
  const lastChangedField = useRef<Field>();
  const tokens = useAppSelector<TokenListItem[]>(
    (state) => state.bancor.tokens
  );

  const percentages = useMemo(() => [1, 3, 5], []);

  useInterval(() => {
    fetchMarketRate();
  }, 15000);

  const calculatePercentageByRate = useCallback(
    (marketRate: number, rate: string) => {
      const percentage = calculatePercentageChange(Number(rate), marketRate);
      const index = percentages.indexOf(percentage);
      if (index === -1) setPercentage(percentage.toFixed(2));
      else {
        setPercentage('');
        setSelPercentage(index);
      }
    },
    [percentages]
  );

  const calcFrom = useCallback(
    (to: string, rate: string) => {
      if (rate && to) {
        const amount = new BigNumber(to).div(rate);
        setFromAmount(amount.toString());
        const usdAmount = amount.times(fromToken!.usdPrice!).toString();
        setFromAmountUsd(usdAmount);
      }
    },
    [fromToken]
  );
  const calcTo = useCallback(
    (from: string, rate: string) => {
      if (rate && from && toToken) {
        const amount = new BigNumber(rate).times(from);
        setToAmount(amount.toString());
        const usdAmount = amount.times(toToken.usdPrice!).toString();
        setToAmountUsd(usdAmount);
      }
    },
    [toToken]
  );
  const calcRate = useCallback(
    (from: string, to: string) => {
      if (from && to) {
        const rate = new BigNumber(to).div(from).toString();
        setRate(rate);
        calculatePercentageByRate(marketRate, rate);
      }
    },
    [calculatePercentageByRate, marketRate]
  );

  const handleFieldChanged = useCallback(
    (field: Field, from: string, to: string, rate: string) => {
      if (
        previousField.current !== lastChangedField.current &&
        lastChangedField.current !== field
      )
        previousField.current = lastChangedField.current;
      lastChangedField.current = field;

      switch (field) {
        case Field.from:
          if (previousField.current === Field.to) calcRate(from, to);
          else calcTo(from, rate);
          break;
        case Field.to:
          if (previousField.current === Field.from) calcRate(from, to);
          else calcFrom(to, rate);
          break;
        case Field.rate:
          if (previousField.current === Field.from) calcTo(from, rate);
          else calcFrom(to, rate);
          break;
      }
    },
    [calcRate, calcTo, calcFrom]
  );

  const calculateRateByMarket = useCallback(
    (marketRate: number, selPercentage: number, percentage: string) => {
      const perc =
        selPercentage === -1
          ? Number(percentage) / 100
          : percentages[selPercentage] / 100;
      const rate = (marketRate * (1 + perc)).toFixed(6);
      handleFieldChanged(Field.rate, fromAmount, toAmount, rate);
      setRate(rate);
    },
    [percentages, fromAmount, toAmount, handleFieldChanged]
  );

  const fetchMarketRate = useCallback(async () => {
    if (!fromToken || !toToken) return;
    if (toToken.address === ethToken) return;

    const mRate = Number(await getRate(fromToken, toToken, '1'));
    setMarketRate(mRate);
  }, [fromToken, toToken]);

  useEffect(() => {
    if (prevMarket === -1)
      calculateRateByMarket(marketRate, selPercentage, percentage);
  }, [
    calculateRateByMarket,
    marketRate,
    selPercentage,
    percentage,
    prevMarket,
  ]);

  useEffect(() => {
    if (toToken && toToken.address === ethToken)
      if (fromToken.address === wethToken) setToToken(undefined);
      else {
        const weth = tokens.find((x) => x.address === wethToken);
        setToToken(weth);
      }
    fetchMarketRate();
  }, [fetchMarketRate, fromToken, toToken, setToToken, tokens]);

  //Check if approval is required
  const checkApproval = async (token: TokenListItem) => {
    try {
      const isApprovalReq = await getNetworkContractApproval(token, fromAmount);
      if (isApprovalReq) setShowApproveModal(true);
      else await handleSwap(true);
    } catch (e) {
      console.error('getNetworkContractApproval failed', e);
      setDisableSwap(false);
      dispatch(
        addNotification({
          type: NotificationType.error,
          title: 'Check Allowance',
          msg: 'Unkown error - check console log.',
        })
      );
    }
  };

  const handleSwap = async (
    approved: boolean = false,
    weth: boolean = false,
    showETHtoWETHModal: boolean = false
  ) => {
    if (!account) {
      dispatch(openWalletModal(true));
      return;
    }

    if (!(fromToken && toToken && fromAmount && toAmount)) return;

    setDisableSwap(true);
    if (showETHtoWETHModal) return setShowEthModal(true);

    if (!approved) return checkApproval(fromToken);

    const notification = await swapLimit(
      weth ? { ...fromToken, address: wethToken } : fromToken,
      toToken,
      fromAmount,
      toAmount,
      account,
      duration,
      checkApproval
    );

    if (notification) {
      dispatch(addNotification(notification));
      setDisableSwap(false);
    }
  };

  return (
    <div>
      <div className="px-20">
        <TokenInputField
          label="You Pay"
          token={fromToken}
          setToken={setFromToken}
          input={fromAmount}
          amountUsd={fromAmountUsd}
          setAmountUsd={setFromAmountUsd}
          onChange={(val: string) => {
            setFromAmount(val);
            handleFieldChanged(Field.from, val, toAmount, rate);
          }}
          border
          selectable
          excludedTokens={
            toToken
              ? [
                  toToken.address,
                  ...(toToken.address === ethToken ||
                  toToken.address === wethToken
                    ? [ethToken, wethToken]
                    : []),
                ]
              : []
          }
        />
      </div>

      <div className="widget-block">
        <div className="widget-block-icon cursor-pointer">
          <IconSync
            className="transform hover:rotate-180 transition duration-500 w-[25px] text-primary dark:text-primary-light"
            onClick={() => switchTokens()}
          />
        </div>
        <div className="mx-10 mb-16 pt-16">
          <TokenInputField
            label="You Receive"
            token={toToken}
            setToken={setToToken}
            input={toAmount}
            amountUsd={toAmountUsd}
            setAmountUsd={setToAmountUsd}
            onChange={(val: string) => {
              setToAmount(val);
              handleFieldChanged(Field.to, fromAmount, val, rate);
            }}
            selectable
            startEmpty
            excludedTokens={
              fromToken
                ? [
                    fromToken.address,
                    ...(fromToken.address === ethToken ||
                    fromToken.address === wethToken
                      ? [ethToken, wethToken]
                      : []),
                  ]
                : []
            }
          />
          {toToken && (
            <>
              <div className="flex justify-between mt-28 mb-2">
                <div className="font-medium">Rate</div>
                <div className="text-12 pr-10">
                  Market Rate:{' '}
                  {`1 ${fromToken?.symbol} = ${prettifyNumber(marketRate)} ${
                    toToken?.symbol
                  }`}
                </div>
              </div>
              <div className="flex justify-between items-center mb-15">
                <div className="whitespace-nowrap text-20 min-w-[135px]">{`1 ${fromToken?.symbol} =`}</div>
                <InputField
                  format
                  input={rate}
                  onChange={(val: string) => {
                    setRate(val);
                    calculatePercentageByRate(marketRate, val);
                    handleFieldChanged(Field.rate, fromAmount, toAmount, val);
                  }}
                />
              </div>
              <div className="flex justify-end space-x-8">
                {percentages.map((slip, index) => (
                  <button
                    key={'slippage' + slip}
                    className={`btn-sm rounded-10 h-[34px] ${classNameGenerator(
                      {
                        'btn-outline-secondary': selPercentage !== index,
                        'btn-primary': selPercentage === index,
                      }
                    )} bg-opacity-0`}
                    onClick={() => {
                      calculateRateByMarket(marketRate, index, '');
                      setSelPercentage(index);
                      setPercentage('');
                    }}
                  >
                    +{slip}%
                  </button>
                ))}
                <div className="w-96">
                  <InputField
                    input={percentage}
                    onBlur={() => {
                      const percNum = Number(percentage);
                      const index = percentages.indexOf(percNum);
                      if (index !== -1 || !percNum) setPercentage('');

                      const sel = percNum
                        ? index
                        : selPercentage === -1
                        ? 1
                        : selPercentage;
                      calculateRateByMarket(marketRate, sel, percentage);
                      setSelPercentage(sel);
                    }}
                    onChange={(val: string) => {
                      calculateRateByMarket(marketRate, -1, val);
                      setPercentage(val);
                    }}
                    format
                    placeholder="Custom"
                    customClass="text-14 py-6 rounded-10 bg-opacity-0 border border-grey-3"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center mt-15">
                <span className="font-semibold">Expires in</span>
                <ModalDuration duration={duration} setDuration={setDuration} />
              </div>
            </>
          )}
        </div>

        <ModalApprove
          isOpen={showApproveModal}
          setIsOpen={setShowApproveModal}
          amount={fromAmount}
          fromToken={fromToken}
          handleApproved={() =>
            handleSwap(true, fromToken.address === ethToken)
          }
          handleCatch={() => setDisableSwap(false)}
        />
        <Modal
          title="Deposit ETH to WETH"
          isOpen={showEthModal}
          setIsOpen={setShowEthModal}
          onClose={() => {
            setShowEthModal(false);
            setDisableSwap(false);
          }}
        >
          <>
            <div>Deposited ETH Will Be Converted to WETH</div>
            <button
              className="btn-primary rounded w-full"
              onClick={() => {
                setShowEthModal(false);
                handleSwap(true);
              }}
            >
              Confirm
            </button>
          </>
        </Modal>

        <button
          className="btn-primary rounded w-full"
          onClick={() =>
            handleSwap(false, false, fromToken.address === ethToken)
          }
          disabled={disableSwap}
        >
          Swap
        </button>
      </div>
    </div>
  );
};
