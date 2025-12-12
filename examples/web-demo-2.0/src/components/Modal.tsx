import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import clsx from "clsx";

interface ModalProps {
  open?: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  closeIcon?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  closeIconClassName?: string;
  isForceNormal?: boolean;
  innerStyle?: React.CSSProperties;
  innerClassName?: string;
  isMaskClose?: boolean;
  isShowCloseIcon?: boolean;
}

const Modal: React.FC<ModalProps> = (props) => {
  const { children, ...restProps } = props;

  return ReactDOM.createPortal(
    (<ModalContent {...restProps}>{children}</ModalContent>) as any,
    document.body
  ) as unknown as React.ReactPortal;
};

export default Modal;

export const ModalContent = (props: ModalProps) => {
  const {
    open,
    onClose,
    children,
    style,
    className,
    isForceNormal,
    isMaskClose = true
  } = props;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMaskClose) return;
    if (e.target === e.currentTarget) {
      onClose && onClose();
    }
  };

  useEffect(() => {
    if (open) {
      document.body.classList.add("drawer-open");
    }

    return () => {
      document.body.classList.remove("drawer-open");
    };
  }, [open]);

  return (
    props.open && (
      <div
        className={clsx(className)}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          zIndex: 200,
          boxSizing: "border-box",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          justifyContent: isForceNormal ? "center" : "flex-start",
          alignItems: isForceNormal ? "center" : "flex-start",
          ...style,
        }}
        onClick={handleBackdropClick}
      >
        <div
          className=""
          style={{
            position: "absolute",
            zIndex: 1,
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {children}
        </div>
      </div>
    )
  );
};
