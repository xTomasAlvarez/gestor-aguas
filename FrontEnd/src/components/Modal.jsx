import { Modal as MantineModal } from '@mantine/core';

/**
 * Modal genérico reutilizable con Mantine.
 * Props: isOpen, onClose, title, children, maxWidth (ahora size)
 */
const Modal = ({ isOpen, onClose, title, children, maxWidth = "lg" }) => {
    return (
        <MantineModal 
            opened={isOpen} 
            onClose={onClose} 
            title={title} 
            size={maxWidth}
            centered
            radius="xl"
            overlayProps={{
                backgroundOpacity: 0.4,
                blur: 3,
                color: '#000'
            }}
            styles={{
                header: { padding: '24px 24px 16px', borderBottom: '1px solid #f1f5f9' },
                title:  { fontSize: '18px', fontWeight: 700, color: '#0f172a' },
                body:   { padding: '24px' },
                content: { backgroundColor: '#fff', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }
            }}
        >
            {children}
        </MantineModal>
    );
};

export default Modal;
