import { openWalletModal } from 'redux/user/user';
import { useDispatch } from 'react-redux';
import { useAppSelector } from 'redux/index';

interface Props {
  onStart: Function;
  amount: string;
  errorMsg: string;
}

export const AddLiquiditySingleCTA = ({ onStart, amount, errorMsg }: Props) => {
  const dispatch = useDispatch();
  const account = useAppSelector<string | undefined>(
    (state) => state.user.account
  );

  const button = () => {
    if (errorMsg) {
      return { label: errorMsg, disabled: true, variant: 'btn-error' };
    }
    if (!amount) {
      return { label: 'Enter amount', disabled: true, variant: 'btn-primary' };
    } else {
      return {
        label: 'Stake and Protect',
        disabled: false,
        variant: 'btn-primary',
      };
    }
  };

  const onClick = () => {
    if (!account) {
      dispatch(openWalletModal(true));
    } else {
      onStart();
    }
  };

  return (
    <button
      onClick={() => onClick()}
      disabled={button().disabled}
      className={`${button().variant} rounded w-full`}
    >
      {button().label}
    </button>
  );
};
