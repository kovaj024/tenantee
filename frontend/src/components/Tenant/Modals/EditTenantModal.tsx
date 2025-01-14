import {
    Box,
    Button,
    FormControl,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    Stack,
} from '@chakra-ui/react';
import { IconPencil } from '@tabler/icons-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Tenant, TenantUpdateDto } from '../../../types/tenant';
import GenericInput from '../../Form/GenericInput';

interface EditTenantModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (property: TenantUpdateDto) => void;
    tenant: Tenant | null;
}

const defaultValues = {
    first_name: '',
    last_name: '',
};

function EditTenantModal({
    isOpen,
    onClose,
    onSubmit,
    tenant,
}: EditTenantModalProps) {
    const { handleSubmit, formState, control, reset } = useForm({
        mode: 'onChange',
        defaultValues,
    });

    useEffect(() => {
        if (tenant) {
            reset({
                first_name: tenant.name.split(' ')[0],
                last_name: tenant.name.split(' ')[1],
            });
        }
    }, [tenant, reset]);

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Update {tenant?.name}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <FormControl>
                        <Stack spacing={4}>
                            <GenericInput
                                name="first_name"
                                label="First Name"
                                placeholder="First name of the tenant"
                                control={control}
                                rules={{
                                    required: 'First name is required',
                                }}
                                leftAdornment={<IconPencil />}
                            />
                            <GenericInput
                                name="last_name"
                                label="Last Name"
                                placeholder="Last name of the tenant"
                                control={control}
                                rules={{
                                    required: 'Last name is required',
                                }}
                                leftAdornment={<IconPencil />}
                            />
                            <Box w="100%">
                                <Button
                                    w="100%"
                                    colorScheme="teal"
                                    isLoading={
                                        tenant === null ||
                                        formState.isSubmitting
                                    }
                                    isDisabled={
                                        !formState.isValid ||
                                        formState.isSubmitting ||
                                        tenant === null
                                    }
                                    onClick={handleSubmit((values) =>
                                        onSubmit({
                                            ...values,
                                            id: tenant?.id ?? 0,
                                        }),
                                    )}>
                                    Update Property
                                </Button>
                            </Box>
                        </Stack>
                    </FormControl>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}

export default EditTenantModal;
