import React, { useCallback, useRef, useState } from 'react';
import { Form } from '@unform/web';
import { FormHandles } from '@unform/core';
import * as Yup from 'yup';
import Button from '../Button';
import Input from '../Input';
import { VscLock, RiCloseLine } from '../../styles/icon';

import { Container } from './styles';
import getValidationErrors from '../../utils/getValidationErrors';
import { useToast } from '../../hooks/toast';
import LoadingDots from '../LoadingDots';
import { useAuth } from '../../hooks/auth';
import api from '../../services/api';
import ChangedPasswordAlert from '../ChangedPasswordAlert';
import { useCustomer } from '../../hooks/customer';

interface PasswordProps {
  password: string;
  confirmpassword: string;
}

interface FirstAccessProps {
  title: string;
  close?: boolean;
}

const FirstAccess: React.FC<FirstAccessProps> = ({ title, close = false }) => {
  const formRef = useRef<FormHandles>(null);
  const [loading, setLoading] = useState(false);
  const [display] = useState(true);
  const [displayAlert, setDisplayAlert] = useState(false);
  const { addToast } = useToast();
  const { user } = useAuth();
  const { setDsiplayModalPassword } = useCustomer();

  const handleSubmit = useCallback(
    async (data: PasswordProps) => {
      try {
        setLoading(true);
        formRef.current?.setErrors({});

        const schema = Yup.object().shape({
          password: Yup.string().required('Senha obrigatória'),
          confirmpassword: Yup.string().oneOf(
            [Yup.ref('password')],
            'Confirmação incorreta',
          ),
        });

        await schema.validate(data, {
          abortEarly: false,
        });

        await api.put(
          `customers/${user.code}/info/personal/${user.document}/change_password`,
          {
            password: data.password,
          },
        );

        const userData = {
          code: user.code,
          document: user.document,
          first_access: false,
          id: user.id,
          name: user.name,
          name_abbreviate: user.name_abbreviate,
        };

        localStorage.setItem('@NeoCliente:user', JSON.stringify(userData));
        setDisplayAlert(true);
      } catch (err) {
        if (err instanceof Yup.ValidationError) {
          const errors = getValidationErrors(err);

          formRef.current?.setErrors(errors);

          return;
        }

        addToast({
          type: 'error',
          title: 'Erro na alteração de senha',
          description: 'Tente novamente mais tarde',
        });
      } finally {
        setLoading(false);
      }
    },
    [addToast, user],
  );

  return (
    <Container display={display}>
      <Form ref={formRef} onSubmit={handleSubmit}>
        <header>
          <h1>{title}</h1>
          <p>Para dar continuidade altere sua senha</p>

          {close && (
            <RiCloseLine
              onClick={() => setDsiplayModalPassword(false)}
              size={24}
              color="var(--text)"
            />
          )}
        </header>

        <main>
          <Input
            type="password"
            width="200px"
            label="Nova Senha"
            name="password"
            icon={VscLock}
          />
          <Input
            type="password"
            width="200px"
            label="Confirme sua Nova Senha"
            name="confirmpassword"
            icon={VscLock}
          />
        </main>

        <Button type="submit">{loading ? <LoadingDots /> : 'Avançar'}</Button>
      </Form>
      {displayAlert && <ChangedPasswordAlert />}
    </Container>
  );
};

export default FirstAccess;
