import { ActionMenu, Button } from '@navikt/ds-react';
import {
    MenuElipsisVerticalIcon,
    NotePencilIcon,
    PersonGavelIcon,
    PersonMinusIcon,
    TrashIcon,
} from '@navikt/aksel-icons';
import { IOrganisation } from '~/types/organisation';

interface OrganisationActionMenu {
    organisation: IOrganisation;
    onEdit: (org: IOrganisation) => void;
    onUnsetLegal: (org: IOrganisation) => void;
    onSelectLegal: (org: IOrganisation) => void;
    onDelete: (org: IOrganisation) => void;
}

export default function OrganisationActionMenu({
    organisation,
    onEdit,
    onUnsetLegal,
    onSelectLegal,
    onDelete,
}: OrganisationActionMenu) {
    return (
        <ActionMenu>
            <ActionMenu.Trigger>
                <Button
                    variant="tertiary-neutral"
                    icon={<MenuElipsisVerticalIcon title="Saksmeny" />}
                    size="small"
                />
            </ActionMenu.Trigger>
            <ActionMenu.Content>
                <ActionMenu.Group label={`${organisation.name}`}>
                    <ActionMenu.Item
                        onSelect={() => onEdit(organisation)}
                        icon={<NotePencilIcon />}>
                        Redigere organisasjon
                    </ActionMenu.Item>
                    <ActionMenu.Item
                        onSelect={() => onUnsetLegal(organisation)}
                        icon={<PersonMinusIcon />}>
                        Fjerne juridisk kontakt
                    </ActionMenu.Item>
                    <ActionMenu.Item
                        onSelect={() => onSelectLegal(organisation)}
                        icon={<PersonGavelIcon />}>
                        Sette juridisk kontakt
                    </ActionMenu.Item>
                    <ActionMenu.Divider />
                    <ActionMenu.Item
                        variant="danger"
                        onSelect={() => onDelete(organisation)}
                        icon={<TrashIcon />}>
                        Slett Organisasjon
                    </ActionMenu.Item>
                </ActionMenu.Group>
            </ActionMenu.Content>
        </ActionMenu>
    );
}