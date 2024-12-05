import { ActionMenu, Button } from '@navikt/ds-react';
import {
    MenuElipsisVerticalIcon,
    PersonCrossIcon,
    PersonEnvelopeIcon,
    PersonPencilIcon,
} from '@navikt/aksel-icons';
import { IContact } from '~/types/contact';
import { ConfirmationModal } from '~/routes/component/ConfirmationModal';
import { useState } from 'react';

interface ActionMenuProps {
    contact: IContact;
    onEdit: (contact: IContact) => void;
    onDelete: (contact: IContact) => void;
}

export default function ContactActionMenu({ contact, onEdit, onDelete }: ActionMenuProps) {
    const handleEmailClick = (contact: IContact) => {
        const mailtoLink = `mailto:${contact.mail}`;
        window.open(mailtoLink, '_blank');
    };
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    const handleDeleteClick = () => {
        setIsModalOpen(true);
    };

    const handleConfirm = () => {
        onDelete(contact);
        setIsModalOpen(false);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    return (
        <>
            <ConfirmationModal
                isOpen={isModalOpen}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                bodyText={`${contact.firstName} ${contact.lastName}`}
            />
            <ActionMenu>
                <ActionMenu.Trigger>
                    <Button
                        variant="tertiary-neutral"
                        icon={<MenuElipsisVerticalIcon title="Saksmeny" />}
                        size="small"
                    />
                </ActionMenu.Trigger>
                <ActionMenu.Content>
                    <ActionMenu.Group label={`${contact.firstName} ${contact.lastName}`}>
                        <ActionMenu.Item
                            onSelect={() => onEdit(contact)}
                            icon={<PersonPencilIcon />}>
                            Redigere kontakt
                        </ActionMenu.Item>
                        <ActionMenu.Item
                            onSelect={() => handleEmailClick(contact)}
                            icon={<PersonEnvelopeIcon />}>
                            Send e-post til kontakt
                        </ActionMenu.Item>
                        <ActionMenu.Divider />

                        <ActionMenu.Item
                            variant="danger"
                            onSelect={handleDeleteClick}
                            icon={<PersonCrossIcon />}>
                            Slett kontakt
                        </ActionMenu.Item>
                    </ActionMenu.Group>
                </ActionMenu.Content>
            </ActionMenu>
        </>
    );
}
