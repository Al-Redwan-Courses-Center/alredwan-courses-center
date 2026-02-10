import SignupForm from "@/components/auth/SignupForm";
import Button from "@/components/ui/Button";
import {
  Modal,
  ModalContent,
  ModalTitle,
  ModalTrigger,
} from "@/components/ui/Modal";

export default function SignupModal() {
  return (
    <Modal>
      <ModalTrigger asChild>
        <Button variant="secondary" size="small">
          إنشاء حساب
        </Button>
      </ModalTrigger>

      <ModalContent className="max-h-[90vh] max-w-20/45 overflow-y-auto">
        <ModalTitle>إنشاء حساب</ModalTitle>
        <div className="flex w-full flex-col items-center">
          <SignupForm />
        </div>
      </ModalContent>
    </Modal>
  );
}
