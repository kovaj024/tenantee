import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    Center,
    Flex,
    Grid,
    GridItem,
    Select,
    Spinner,
    Stack,
    Text,
    useColorMode,
    useDisclosure,
} from '@chakra-ui/react';
import { IconArrowBack, IconHome, IconMoneybag } from '@tabler/icons-react';
import { isEmpty, prop } from 'ramda';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import ConfirmModal from '../components/Modals/ConfirmModal';
import Breadcrumbs from '../components/Navigation/Breadcrumbs';
import PageContainer from '../components/PageContainer';
import TenantCard from '../components/Tenant/TenantCard';
import { useFetch } from '../hooks/useFetch';
import { useNotification } from '../hooks/useNotification';
import { propertyApiService } from '../services/api/PropertyApiService';
import { tenantApiService } from '../services/api/TenantApiService';
import { Tenant } from '../types/tenant';
import { formatMoney } from '../utils/money';

function PropertyPage() {
    const { colorMode } = useColorMode();
    const { id } = useParams();
    const navigate = useNavigate();
    const { showError, showSuccess } = useNotification();

    const onTenantCardClick = useCallback(
        (tenant: Tenant) => navigate(`/tenants/${tenant.id}`),
        [navigate],
    );

    const {
        data: property,
        isError: isPropertyError,
        isLoading: isPropertyLoading,
        mutate,
    } = useFetch([propertyApiService.apiRoute, id], propertyApiService.get);

    const { data: { tenants } = { tenants: [] }, isLoading: isTenantsLoading } =
        useFetch(tenantApiService.apiRoute, tenantApiService.list);

    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

    const selectRef = useRef<HTMLSelectElement>(null);

    const {
        isOpen: isConfirmAddModalOpen,
        onOpen: openConfirmAddModal,
        onClose: closeConfirmAddModal,
    } = useDisclosure();
    const {
        isOpen: isConfirmRemoveModalOpen,
        onOpen: openConfirmRemoveModal,
        onClose: closeConfirmRemoveModal,
    } = useDisclosure();

    const tenantOptions = useMemo(() => {
        if (!tenants || !property) {
            return [];
        }

        const tenantIds = property.tenants.map(prop('id'));

        return tenants.filter((tenant) => !tenantIds.includes(tenant.id));
    }, [tenants, property]);

    const revenue = useMemo(() => {
        if (!property) {
            return null;
        }

        return property.monthly_revenue;
    }, [property]);

    const expenses = useMemo(() => {
        if (!property) {
            return null;
        }

        // Get all expenses for the property
        // that are in the current month
        const expenses = property.expenses.filter((expense) => {
            const expenseDate = new Date(expense.date);
            const currentDate = new Date();

            return (
                expenseDate.getMonth() === currentDate.getMonth() &&
                expenseDate.getFullYear() === currentDate.getFullYear()
            );
        });

        // Sum up all expenses
        return expenses.reduce((acc, expense) => {
            return acc + Number(expense.amount.amount);
        }, 0);
    }, [property]);

    const chartOptions = useMemo(() => {
        return {
            color: colorMode === 'light' ? '#000' : '#fff',
        };
    }, [colorMode]);

    const chartData = useMemo(() => {
        return [
            {
                name: 'Revenue',
                value: revenue?.amount ?? 0,
                fill: '#00B87C',
            },
            {
                name: 'Expenses',
                value: expenses ?? 0,
                fill: '#FF5C93',
            },
        ];
    }, [revenue, expenses]);

    const breadcrumbs = useMemo(
        () => [
            {
                label: 'Properties',
                href: '/properties',
            },
            {
                label: property?.name,
                href: `/properties/${property?.id}`,
            },
        ],
        [property],
    );

    const onTenantAddSubmit = useCallback(async () => {
        if (property && selectedTenant && selectRef.current) {
            try {
                await propertyApiService.addTenant(
                    property.id,
                    selectedTenant.id,
                );

                showSuccess(
                    'Tenant added',
                    `${selectedTenant.name} was added to the property.`,
                );
            } catch (e) {
                showError(
                    'Error',
                    'An error occured while trying to add the tenant to the property.',
                );
            } finally {
                setSelectedTenant(null);
                mutate();
                selectRef.current.value = '';
                closeConfirmAddModal();
            }
        }
    }, [
        property,
        selectedTenant,
        showSuccess,
        showError,
        mutate,
        closeConfirmAddModal,
    ]);

    const onTenantAddCancel = useCallback(() => {
        setSelectedTenant(null);
        closeConfirmAddModal();
    }, [closeConfirmAddModal]);

    const onTenantRemoveSubmit = useCallback(async () => {
        if (selectedTenant && id) {
            try {
                await propertyApiService.removeTenant(id, selectedTenant.id);

                showSuccess(
                    'Tenant removed',
                    `${selectedTenant.name} was removed from the property`,
                );
            } catch (e) {
                showError(
                    'Error',
                    'An error occurred while trying to remove the tenant from the property',
                );
            } finally {
                setSelectedTenant(null);
                closeConfirmRemoveModal();
                mutate();
            }
        }
    }, [
        selectedTenant,
        id,
        showSuccess,
        showError,
        closeConfirmRemoveModal,
        mutate,
    ]);

    return (
        <Box>
            <ConfirmModal
                isOpen={isConfirmAddModalOpen}
                title={`Add ${selectedTenant?.name} to ${property?.name}?`}
                message={`Are you sure you want to add ${selectedTenant?.name} to ${property?.name}?`}
                onConfirm={onTenantAddSubmit}
                onClose={onTenantAddCancel}
            />
            <ConfirmModal
                isOpen={isConfirmRemoveModalOpen}
                title={`Remove ${selectedTenant?.name} from ${property?.name}?`}
                message={`Are you sure you want to remove ${selectedTenant?.name} from the property?`}
                onConfirm={onTenantRemoveSubmit}
                onClose={closeConfirmRemoveModal}
            />
            <Breadcrumbs items={breadcrumbs} />
            <PageContainer>
                {isPropertyLoading && (
                    <Center>
                        <Spinner size="lg" />
                    </Center>
                )}
                {!isPropertyError && !isPropertyError && property && (
                    <Stack spacing={1}>
                        <Flex gap={2} alignItems="center">
                            <IconArrowBack
                                size={24}
                                cursor="pointer"
                                onClick={() => navigate('/properties')}
                            />
                            <Text fontSize="2xl" fontWeight="bold">
                                {property.name}
                            </Text>
                        </Flex>
                        <Flex gap={2} alignItems="center">
                            <IconHome size={20} />
                            <Text>{property.location}</Text>
                        </Flex>
                        <Text>{property.description}</Text>
                        <Flex gap={2} alignItems="center">
                            <IconMoneybag size={20} />
                            <Text>
                                {formatMoney(
                                    property.price.amount,
                                    property.price.currency,
                                )}
                            </Text>
                        </Flex>
                        {revenue && (
                            <Accordion allowToggle>
                                <AccordionItem>
                                    <AccordionButton>
                                        <Text>Profit/Loss</Text>
                                        <AccordionIcon />
                                    </AccordionButton>
                                    <AccordionPanel>
                                        <BarChart
                                            width={window.innerWidth - 100}
                                            height={300}
                                            style={{ margin: 0 }}
                                            data={chartData}>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                color={chartOptions.color}
                                            />
                                            <Tooltip
                                                separator=": "
                                                formatter={(value: unknown) => {
                                                    return formatMoney(
                                                        value as number,
                                                        revenue.currency,
                                                    );
                                                }}
                                            />
                                            <XAxis
                                                dataKey="name"
                                                tick={{
                                                    fill: chartOptions.color,
                                                }}
                                            />
                                            <YAxis
                                                tick={{
                                                    fill: chartOptions.color,
                                                }}
                                                tickFormatter={(tick) =>
                                                    formatMoney(
                                                        tick,
                                                        revenue.currency,
                                                    )
                                                }
                                            />
                                            <Bar dataKey="value" />
                                        </BarChart>
                                    </AccordionPanel>
                                </AccordionItem>
                            </Accordion>
                        )}
                        <Grid templateColumns="repeat(3, 1fr)" gap={6}>
                            {property.tenants.map((tenant) => (
                                <GridItem key={tenant.id}>
                                    <TenantCard
                                        tenant={tenant}
                                        onClick={onTenantCardClick}
                                        onDeleteClick={(tenant) => {
                                            setSelectedTenant(tenant);
                                            openConfirmRemoveModal();
                                        }}
                                    />
                                </GridItem>
                            ))}
                        </Grid>
                        <Flex gap={2} direction="column">
                            <Text fontWeight="bold">Add tenants</Text>
                            <Select
                                placeholder="Tenants..."
                                ref={selectRef}
                                onChange={(e) => {
                                    setSelectedTenant(
                                        tenantOptions.find(
                                            (t) =>
                                                t.id === Number(e.target.value),
                                        ) as Tenant,
                                    );
                                    openConfirmAddModal();
                                }}
                                isDisabled={
                                    isTenantsLoading ||
                                    isEmpty(tenantOptions) ||
                                    selectedTenant !== null
                                }>
                                {tenantOptions.map((tenant) => (
                                    <option key={tenant.id} value={tenant.id}>
                                        {tenant.name}
                                    </option>
                                ))}
                            </Select>
                        </Flex>
                    </Stack>
                )}
            </PageContainer>
        </Box>
    );
}

export default PropertyPage;
