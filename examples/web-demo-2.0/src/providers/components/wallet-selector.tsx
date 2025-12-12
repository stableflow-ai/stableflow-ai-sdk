import Modal from "../../components/Modal";

const WalletSelector = (props: any) => {
  const {
    open,
    onClose,
    wallets,
    title,
    isConnecting,
    onConnect,
    readyState,
  } = props;

  return (
    <Modal
      open={open}
      onClose={onClose}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div style={{
        padding: '24px',
        backgroundColor: 'white',
        borderBottomLeftRadius: '16px',
        borderBottomRightRadius: '16px',
        borderTopLeftRadius: '16px',
        borderTopRightRadius: '16px',
        width: '400px',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: 600,
            color: '#1A1A1A',
            margin: 0
          }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              cursor: 'pointer',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#F5F5F5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              padding: 0,
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#E5E5E5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#F5F5F5';
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 4L4 12M4 4L12 12"
                stroke="#666666"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Wallet List */}
        <div style={{
          maxHeight: '400px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {wallets
            .map((_wallet: any) => (
              <button
                key={_wallet.name}
                onClick={() => {
                  if (readyState && _wallet[readyState.key] !== readyState.value) {
                    window.open(_wallet.url, "_blank");
                    return;
                  }
                  onConnect(_wallet);
                }}
                disabled={isConnecting === _wallet.name}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: isConnecting === _wallet.name ? 'not-allowed' : 'pointer',
                  opacity: isConnecting === _wallet.name ? 0.5 : 1,
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (isConnecting !== _wallet.name) {
                    e.currentTarget.style.backgroundColor = '#F8F9FA';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {/* Wallet Icon */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: '#F5F5F5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {_wallet.icon ? (
                    <img
                      src={_wallet.icon}
                      alt={_wallet.name}
                      style={{
                        width: '24px',
                        height: '24px'
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: '#E5E5E5'
                    }} />
                  )}
                </div>

                {/* Wallet Info */}
                <div style={{
                  flex: 1,
                  textAlign: 'left'
                }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 500,
                    color: '#1A1A1A',
                    marginBottom: '2px'
                  }}>
                    {_wallet.name}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#666666'
                  }}>{_wallet.name}</div>
                </div>

                {/* Installed Badge */}
                {
                  (readyState && _wallet[readyState.key] === readyState.value) && (
                    <div style={{
                      textTransform: 'uppercase',
                      fontSize: '12px',
                      padding: '2px 6px',
                      color: '#26d962',
                      backgroundColor: 'rgba(38, 217, 98, 0.2)',
                      borderRadius: '4px'
                    }}>
                      Detected
                    </div>
                  )
                }

                {/* Loading State */}
                {isConnecting === _wallet.name && (
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid #6284F5',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                )}
              </button>
            ))}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid #E5E5E5'
        }}>
          <p style={{
            fontSize: '12px',
            color: '#999999',
            textAlign: 'center',
            margin: 0
          }}>
            By connecting a wallet, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default WalletSelector;
