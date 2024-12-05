import { useFetcher, useLoaderData } from '@remix-run/react';
import { ActionFunction, LoaderFunction } from '@remix-run/node';
import { Pagination, Search } from '@navikt/ds-react';
import { IOrganisation } from '~/types/organisation';
import OrganisationApi from '~/api/OrganisationApi';
import ContactsApi from '~/api/ContactsApi';
import { useState } from 'react';
import { IContact } from '~/types/contact';
import InternalPageHeader from '~/components/InternalPageHeader';
import { Buildings3Icon } from '@navikt/aksel-icons';
import OrganisationTable from '~/routes/organisation/OrganisationTable';
import OrganisationForm from '~/routes/organisation/OrganisationForm';
import logger from '~/components/logger';
import useAlerts from '~/components/useAlerts';
import { IFetcherResponseMessage } from '~/types/FetcherResponseData';
import AlertManager from '~/components/AlertManager';

export const loader: LoaderFunction = async () => {
    let contacts: IContact[] = [];
    let organizations: IOrganisation[] = [];
    const alerts: IAlertType[] = [];

    const contactsResult = await ContactsApi.getContacts();
    const organizationsResult = await OrganisationApi.getOrganisations();

    if (!contactsResult.success) {
        alerts.push({
            id: Date.now(),
            variant: 'error',
            message: `Kunne ikke hente kontakter: ${contactsResult.message}`,
            header: 'Error',
        });
    } else {
        contacts = contactsResult.data || [];
    }

    if (!organizationsResult.success) {
        alerts.push({
            id: Date.now() + 1,
            variant: 'error',
            message: `Kunne ikke hente organisasjoner: ${organizationsResult.message}`,
            header: 'Error',
        });
    } else {
        organizations = organizationsResult.data || [];
    }

    if (organizations.length > 0) {
        organizations.sort((a, b) => a.name.localeCompare(b.name));
    }

    return new Response(JSON.stringify({ contacts, organizations, alerts }), {
        headers: { 'Content-Type': 'application/json' },
    });
};

export default function OrganizationsPage() {
    const {
        contacts,
        organizations,
        alerts: initialAlerts,
    } = useLoaderData<{
        contacts: IContact[];
        organizations: IOrganisation[];
        alerts: IAlertType[];
    }>();
    const breadcrumbs = [{ name: 'Organisasjoner', link: '/organisation' }];

    const [editingOrg, setEditingOrg] = useState<IOrganisation | null>(null);
    const [addingNew, setAddingNew] = useState<boolean>(false);

    const fetcher = useFetcher();
    const actionData = fetcher.data as IFetcherResponseMessage;

    const { alerts, removeAlert } = useAlerts(actionData, fetcher.state);
    const allAlerts = [...initialAlerts, ...alerts];

    const [searchQuery, setSearchQuery] = useState('');
    const filteredOrgs = organizations.filter(
        (org) =>
            org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            org.orgNumber.includes(searchQuery) ||
            org.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedOrgs = filteredOrgs.slice(startIndex, endIndex);

    const handleFormSubmit = (formData: FormData) => {
        const actionType = editingOrg ? 'EDIT_ORG' : 'ADD_NEW_ORG';
        formData.append('actionType', actionType);
        fetcher.submit(formData, { method: 'post' });
        setAddingNew(false);
        setEditingOrg(null);
    };

    const handleSetLegal = (formData: FormData) => {
        formData.append('actionType', 'SET_LEGAL');
        fetcher.submit(formData, { method: 'post' });
    };

    const handleRemoveLegal = (organisation: IOrganisation) => {
        const contactNin = organisation.legalContact?.split('cn=')[1].split(',')[0];

        const formData = new FormData();
        formData.append('name', organisation.name);
        formData.append('contactNin', contactNin as string);
        formData.append('actionType', 'UNSET_LEGAL');
        fetcher.submit(formData, { method: 'post' });
    };

    const handleDelete = (organisation: IOrganisation) => {
        const formData = new FormData();
        formData.append('name', organisation.name);
        formData.append('actionType', 'DELETE_ORG');
        fetcher.submit(formData, { method: 'post' });
    };

    return (
        <div>
            <InternalPageHeader
                title={addingNew ? 'Legg til ny organisasjon' : 'Organisasjoner'}
                icon={Buildings3Icon}
                breadcrumbs={breadcrumbs}
                onActionButtonClick={
                    !addingNew && !editingOrg ? () => setAddingNew(true) : undefined
                }
            />
            <AlertManager alerts={allAlerts} removeAlert={removeAlert} />
            {addingNew || editingOrg ? (
                <OrganisationForm
                    organization={editingOrg}
                    onCancel={() => {
                        setAddingNew(false);
                        setEditingOrg(null);
                    }}
                    handleFormSubmit={handleFormSubmit}
                />
            ) : (
                <>
                    <Search
                        label="Search organizations"
                        variant="simple"
                        value={searchQuery}
                        onChange={(value: string) => setSearchQuery(value)}
                    />
                    <OrganisationTable
                        contacts={contacts}
                        organisations={paginatedOrgs}
                        onEdit={setEditingOrg}
                        onSetLegal={handleSetLegal}
                        onUnsetLegal={handleRemoveLegal}
                        onDelete={handleDelete}
                    />

                    {filteredOrgs.length > 15 && (
                        <Pagination
                            page={currentPage}
                            onPageChange={(page) => setCurrentPage(page)}
                            count={Math.ceil(filteredOrgs.length / itemsPerPage)}
                            size="small"
                            className={'pt-10'}
                        />
                    )}
                </>
            )}
        </div>
    );
}

export const action: ActionFunction = async ({ request }) => {
    const formData = await request.formData();
    const actionType = formData.get('actionType') as string;
    const contact = formData.get('contactNin') as string;

    const newOrg: IOrganisation = {
        name: formData.get('name') as string,
        orgNumber: formData.get('orgNumber') as string,
        displayName: formData.get('displayName') as string,
    };
    logger.debug(`Received action: ${actionType} in organisation route`);

    switch (actionType) {
        case 'ADD_NEW_ORG':
            logger.info('Adding new organisation', newOrg);
            return await OrganisationApi.addOrganisation(newOrg);
        case 'EDIT_ORG':
            newOrg.dn = formData.get('dn') as string;
            logger.info('Editing organisation', newOrg);
            return await OrganisationApi.updateOrganisation(newOrg);
        case 'SET_LEGAL':
            logger.info('Setting legal contact organisation', newOrg);
            return await OrganisationApi.updateLegalContact(newOrg.name, contact, 'SET');
        case 'UNSET_LEGAL':
            logger.info('Removing legal contact organisation', newOrg);
            return await OrganisationApi.updateLegalContact(newOrg.name, contact, 'REMOVE');
        case 'DELETE_ORG':
            logger.info('Delete organisation', newOrg);
            return await OrganisationApi.deleteOrganisation(newOrg);
        default:
            logger.warn(`Unknown action type: ${actionType}`);
            return new Response(
                JSON.stringify({
                    message: `Ukjent handlingstype: '${actionType}'`,
                    variant: 'error',
                }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
    }
};