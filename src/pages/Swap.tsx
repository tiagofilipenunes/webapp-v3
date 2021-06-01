import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BaseModal } from 'components/modal/Modal';
import { Dropdown } from 'components/dropdown/Dropdown';
import { TokensOverlap } from 'components/tokensOverlap/TokensOverlap';
import { SwapMarketWidget } from '../widgets/swap/SwapMarketWidget';

export const Swap = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-20 p-20">
      <SwapMarketWidget />

      <div>
        <BaseModal title="Some Title" setIsOpen={setIsOpen} isOpen={isOpen}>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. At
            deleniti deserunt dolor eveniet, expedita facere impedit iste maxime
            modi nihil quae quo similique tempore temporibus, voluptas. Ad
            aspernatur corporis esse?
          </p>

          <div className="mt-4">
            <button
              type="button"
              className="inline-flex justify-center px-4 py-2 font-medium text-blue-900 bg-blue-100 border border-transparent rounded hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
          </div>
        </BaseModal>
      </div>
      <div className="mb-10">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="btn-primary"
        >
          Open Modal
        </button>
      </div>
      <Link to="/buttons">
        <button className="btn-pink">Button Samples</button>
      </Link>

      <TokensOverlap
        tokens={[
          {
            id: '1',
            logo: 'https://assets.coingecko.com/coins/images/279/thumb_2x/ethereum.png?1595348880',
          },
          {
            id: '2',
            logo: 'https://assets.coingecko.com/coins/images/736/thumb_2x/bancor.png?1547034477',
          },
        ]}
      />

      <Dropdown
        title={'Dropdown'}
        items={[
          { id: '1', title: 'item1' },
          { id: '2', title: 'item2' },
          { id: '3', title: 'item3' },
          { id: '4', title: 'item4' },
          { id: '5', title: 'item5' },
          { id: '6', title: 'item6' },
          { id: '7', title: 'item7' },
          { id: '8', title: 'item8' },
          { id: '9', title: 'item9' },
          { id: '10', title: 'item10' },
          { id: '11', title: 'item11' },
          { id: '12', title: 'item12' },
        ]}
      />
    </div>
  );
};
